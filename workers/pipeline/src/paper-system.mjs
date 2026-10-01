/**
 * PAPER system: one cycle through every pipeline stage.
 * Missing adapters → UNAVAILABLE. Never invents quotes, fills, or marks.
 * LIVE refused.
 */
import { discoverMintUniverse } from "../../../services/discovery/src/discover-mints.mjs";
import { fetchJupiterQuote, fetchJupiterSwapTx } from "../../../services/quote/src/jupiter-fetch.mjs";
import { rpcCallPooled } from "../../../packages/solana/src/rpc-pool.mjs";
import { defaultLiveEngine } from "../../../services/execution/src/live-engine.mjs";
import { analyzeFeatures, rankCandidates } from "./rank-candidates.mjs";
import { loadState, saveState, persistState, reconcile } from "./state-store.mjs";
import { markPositions } from "./mark-positions.mjs";
import { loadFeatures } from "./feature-adapters.mjs";
import { confirmPaperFill, verifyRecovery, reconcileSignature } from "./confirm-recover.mjs";
import { evaluateExit } from "../../../services/exits/src/exit-engine.mjs";
import { isKillSwitchOn, wantsManualExit, snapshot as controlSnapshot } from "../../../services/control-gateway/src/control-state.mjs";
import { priceFromQuote } from "./pnl.mjs";


export const STAGES = [
  "discover",
  "analyze",
  "score",
  "signal",
  "quote",
  "build",
  "simulate",
  "risk",
  "paper_execute",
  "position",
  "exit",
];

export const ledger = {
  cycles: [],
  positions: [],
  outcomes: [],
  runs: [],
};

export function assertPaper(mode = process.env.TRADING_MODE) {
  const m = String(mode ?? "PAPER").toUpperCase();
  if (m === "LIVE") throw new Error("LIVE_MODE_REFUSED");
  return m;
}

export async function rpcCall(rpc, method, params = []) {
  try {
    const res = await fetch(rpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    if (!res.ok) return { availability: "UNAVAILABLE", value: null };
    const json = await res.json();
    if (json.error) return { availability: "UNAVAILABLE", value: null };
    return { availability: "OK", value: json.result };
  } catch {
    return { availability: "UNAVAILABLE", value: null };
  }
}

function stage(name, kind, extra = {}) {
  return { stage: name, kind, ...extra };
}

export function scoreSnapshot(snapshot, weights) {
  const parts = [
    [snapshot.security, weights.security],
    [snapshot.smartMoney, weights.smartMoney],
    [snapshot.momentum, weights.momentum],
    [snapshot.holder, weights.holder],
  ];
  if (parts.some(([v]) => v == null)) return { score: null, availability: "UNAVAILABLE" };
  const score = parts.reduce((a, [v, w]) => a + v * w, 0);
  return { score, availability: "OK" };
}

export function authorizeRisk(sizeUsd, max = 250, extra = {}) {
  if (extra.killSwitch) return { allowed: false, reason: "kill_switch" };
  if (extra.lifecycle && extra.lifecycle !== "RUNNING") return { allowed: false, reason: `lifecycle_${extra.lifecycle}` };
  if (sizeUsd == null) return { allowed: false, reason: "size_unknown" };
  if (sizeUsd > max) return { allowed: false, reason: "hard_limit" };
  return { allowed: true, reason: "ok" };
}

export { evaluateExit };

export async function runPaperCycle(opts = {}) {
  const mode = assertPaper(opts.mode);
  const rpc = opts.rpc ?? process.env.SOLANA_RPC_PRIMARY ?? "https://api.mainnet-beta.solana.com";
  const cycleId = `cycle_${Date.now()}`;
  const stages = [];
  const startedAt = new Date().toISOString();

  const rpcList = (
    opts.rpcList ??
    [rpc, process.env.SOLANA_RPC_BACKUP ?? "https://solana-rpc.publicnode.com"]
  ).filter(Boolean);
  const slot = await rpcCallPooled(rpcList, "getSlot");
  const universe = await discoverMintUniverse({ rpc, mints: opts.mints ?? process.env.PAPER_MINTS });
  stages.push(
    stage(
      "discover",
      slot.availability === "UNAVAILABLE" && universe.availability === "UNAVAILABLE" ? "UNAVAILABLE" : "CONTINUE",
      {
        slot: slot.value,
        mintSource: universe.source,
        mintCount: universe.mints.length,
        mintAvailability: universe.availability,
        reason: universe.reason,
      },
    ),
  );

  const mints = universe.mints;
  const featuresByMint = opts.features ?? (await loadFeatures(mints, rpcList));
  if (mints.length === 0) {
    stages.push(
      stage("analyze", universe.availability === "UNAVAILABLE" ? "UNAVAILABLE" : "EMPTY", {
        reason: universe.reason,
        mintSource: universe.source,
      }),
    );
  } else {
    stages.push(
      stage("analyze", "CONTINUE", {
        mints,
        mintSource: universe.source,
        note: "features from chain adapters or operator map — no invented stats",
        featureMints: Object.keys(featuresByMint),
      }),
    );
  }

  const analyzedOk = mints.length > 0;
  const analyzed = analyzeFeatures(mints, featuresByMint);
  const weights = opts.weights ?? { security: 0.25, smartMoney: 0.25, momentum: 0.25, holder: 0.25 };
  const ranked = rankCandidates(analyzed, weights, opts.signalFloor ?? 0.2);
  const scored = ranked.top
    ? { score: ranked.top.score, availability: "OK", ranked: ranked.ranked }
    : { score: null, availability: ranked.availability, reason: analyzedOk ? "no_complete_features" : "no_mint_universe", ranked: ranked.ranked };
  const runId = `run_${cycleId}`;
  ledger.runs.push({ runId, policyVersion: opts.policyVersion ?? "policy_v1", score: scored.score, availability: scored.availability });
  stages.push(stage("score", scored.availability === "OK" ? "CONTINUE" : "UNAVAILABLE", scored));

  const signalOn = Boolean(ranked.top);
  stages.push(stage("signal", signalOn ? "CONTINUE" : "BLOCK", { emitted: signalOn, top: ranked.top }));

  const targetMint = ranked.top?.mint ?? null;
  let quoteRes = { availability: "UNAVAILABLE", reason: signalOn ? "no_mint" : "signal_blocked", quote: null, raw: null };
  if (targetMint) {
    quoteRes = await fetchJupiterQuote({ outputMint: targetMint });
  }
  stages.push(
    stage(
      "quote",
      quoteRes.availability === "OK" ? "CONTINUE" : quoteRes.availability === "EMPTY" ? "EMPTY" : "UNAVAILABLE",
      { reason: quoteRes.reason, outAmount: quoteRes.quote?.outAmount ?? null },
    ),
  );

  const userPk = process.env.PAPER_WALLET_PUBKEY ?? null;
  let built = { availability: "UNAVAILABLE", reason: "no_quote", swapTx: null };
  if (quoteRes.availability === "OK") {
    built = await fetchJupiterSwapTx({
      quote: quoteRes.quote,
      quoteRaw: quoteRes.raw,
      userPublicKey: userPk,
    });
  }
  stages.push(
    stage("build", built.availability === "OK" ? "CONTINUE" : "UNAVAILABLE", {
      reason: built.reason,
      hasTx: Boolean(built.swapTx),
    }),
  );

  let sim = { availability: "UNAVAILABLE", reason: "no_tx" };
  if (built.swapTx) {
    const simRes = await rpcCallPooled(rpcList, "simulateTransaction", [
      built.swapTx,
      { encoding: "base64", sigVerify: false, replaceRecentBlockhash: true },
    ]);
    sim = {
      availability: simRes.availability === "OK" && !simRes.value?.value?.err ? "OK" : "UNAVAILABLE",
      reason:
        simRes.availability !== "OK"
          ? "simulate_unavailable"
          : simRes.value?.value?.err
            ? "simulate_err"
            : "simulated",
      err: simRes.value?.value?.err ?? null,
    };
  }
  stages.push(stage("simulate", sim.availability === "OK" ? "CONTINUE" : "UNAVAILABLE", sim));

  const sizeUsd = opts.sizeUsd ?? 25;
  const ctrl = controlSnapshot();
  const risk = authorizeRisk(sizeUsd, 250, { killSwitch: isKillSwitchOn(), lifecycle: ctrl.lifecycle });
  stages.push(stage("risk", risk.allowed ? "CONTINUE" : "BLOCK", risk));

  const simPassed = sim.availability === "OK" && !sim.err;
  const buildPassed = built.availability === "OK" && Boolean(built.swapTx);
  const quoteIn = Number(quoteRes.quote?.inAmount ?? 10_000_000);
  const entryPrice = priceFromQuote(quoteRes.quote, quoteIn);
  const canPaper =
    signalOn &&
    quoteRes.availability === "OK" &&
    quoteRes.quote?.outAmount != null &&
    entryPrice != null &&
    risk.allowed &&
    buildPassed &&
    simPassed;
  const paper = canPaper
    ? {
        executed: true,
        reason: "paper_ledger_fill_after_sim",
        runId,
        outAmount: quoteRes.quote.outAmount,
        inAmount: quoteIn,
        entryPrice,
        mint: targetMint,
        chainSubmitted: false,
      }
    : {
        executed: false,
        reason: !risk.allowed
          ? risk.reason
          : !buildPassed
            ? `build_required:${built.reason}`
            : !simPassed
              ? `sim_required:${sim.reason}`
              : quoteRes.reason ?? "no_quote",
        runId,
        chainSubmitted: false,
      };
  stages.push(stage("paper_execute", canPaper ? "CONTINUE" : "BLOCK", paper));

  if (paper.executed) {
    ledger.positions.push({
      runId,
      mint: targetMint,
      entryOutAmount: paper.outAmount,
      entryInAmount: paper.inAmount,
      entryPrice: paper.entryPrice,
      remainingSizeFraction: 1,
      legsFilled: 0,
      openedAt: Date.now(),
      mode: "PAPER",
    });
  }
  stages.push(
    stage("position", "CONTINUE", {
      opened: paper.executed,
      reason: paper.executed ? "paper_position" : "no paper fill",
      openCount: ledger.positions.length,
    }),
  );
  const marked = await markPositions(ledger.positions, { amountLamports: quoteIn || 10_000_000 });
  ledger.positions = marked;
  const open = marked[0];
  const exit = evaluateExit(
    open
      ? {
          entryPrice: open.entryPrice ?? null,
          markPrice: open.markPrice ?? null,
          markStatus: open.markStatus ?? "UNAVAILABLE",
          killSwitchActive: isKillSwitchOn(),
          manualExitRequested: wantsManualExit(open.runId),
          remainingSizeFraction: open.remainingSizeFraction ?? 1,
          peakUnrealizedPnlPct: open.peakUnrealizedPnlPct ?? null,
          breakEvenArmed: Boolean(open.breakEvenArmed),
          legsFilled: open.legsFilled ?? 0,
          holdMs: open.openedAt ? Date.now() - open.openedAt : null,
        }
      : {
          entryPrice: null,
          markPrice: null,
          markStatus: "UNAVAILABLE",
          killSwitchActive: isKillSwitchOn(),
          remainingSizeFraction: 0,
          legsFilled: 0,
          peakUnrealizedPnlPct: null,
          breakEvenArmed: false,
          holdMs: null,
        },
  );
  let sell = null;
  if (open) {
    open.legsFilled = exit.nextLegsFilled;
    open.breakEvenArmed = exit.armBreakEven;
    if (exit.wouldExit) {
      open.remainingSizeFraction = Math.max(0, (open.remainingSizeFraction ?? 1) - exit.sizeFraction);
      sell = {
        intent: "PAPER_SELL",
        runId: open.runId,
        mint: open.mint,
        reason: exit.reason,
        sizeFraction: exit.sizeFraction,
        chainSubmitted: false,
      };
      ledger.outcomes.push(sell);
    }
  }
  stages.push(stage("exit", "CONTINUE", { ...exit, sell }));

  const hadUnavailable = stages.some((s) => s.kind === "UNAVAILABLE");
  const blocked = stages.some((s) => s.kind === "BLOCK");
  const liveAttempt = await defaultLiveEngine.execute({
    mint: targetMint,
    amountLamports: 10_000_000,
  });

  const persist = loadState();
  persist.cycles.push({ cycleId, paperExecuted: paper.executed, liveAttempt });
  persist.positions = ledger.positions;
  persist.lastSlot = slot.value;
  const rec = reconcile(persist);
  const persisted = await persistState(persist);
  const confirmation = confirmPaperFill(paper);
  const chainRecon = await reconcileSignature(confirmation.signature);
  const recovery = verifyRecovery(persist);

  const report = {
    cycleId,
    mode,
    live: false,
    startedAt,
    finishedAt: new Date().toISOString(),
    status: blocked ? "BLOCKED" : "COMPLETED",
    riskAuthorized: risk.allowed,
    paperExecuted: paper.executed,
    positionOpened: paper.executed,
    hadUnavailable,
    slot: slot.value,
    slotAvailability: slot.availability,
    liveAttempt,
    ranked: ranked.ranked,
    reconciliation: rec,
    confirmation,
    chainRecon,
    recovery,
    persist: persisted,
    stages,
  };
  ledger.cycles.push(report);
  ledger.outcomes.push({ runId, paperExecuted: paper.executed, recon: rec.ok });
  return report;
}

export function readiness() {
  return {
    paperModePass: false,
    testnetPass: false,
    riskTestPass: false,
    executionTestPass: false,
    recoveryTestPass: false,
    manualAdminApproval: null,
    liveModeEnabled: false,
    productionReady: false,
    tradingMode: assertPaper(),
  };
}
