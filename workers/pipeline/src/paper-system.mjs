/**
 * PAPER system: one cycle through every pipeline stage.
 * Missing adapters → UNAVAILABLE. Never invents quotes, fills, or marks.
 * LIVE refused.
 */

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

export function authorizeRisk(sizeUsd, max = 250) {
  if (sizeUsd == null) return { allowed: false, reason: "size_unknown" };
  if (sizeUsd > max) return { allowed: false, reason: "hard_limit" };
  return { allowed: true, reason: "ok" };
}

export function evaluateExit(pos) {
  if (pos.killSwitchActive) return { wouldExit: true, reason: "KILL_SWITCH", sizeFraction: pos.remainingSizeFraction ?? 1 };
  if (pos.markStatus !== "OK" || pos.entryPrice == null || pos.markPrice == null) {
    return { wouldExit: false, reason: "NONE", sizeFraction: 0 };
  }
  const pnl = ((pos.markPrice - pos.entryPrice) / pos.entryPrice) * 100;
  if (pnl <= -8) return { wouldExit: true, reason: "STOP_LOSS", sizeFraction: pos.remainingSizeFraction ?? 1, pnl };
  return { wouldExit: false, reason: "NONE", sizeFraction: 0, pnl };
}

export async function runPaperCycle(opts = {}) {
  const mode = assertPaper(opts.mode);
  const rpc = opts.rpc ?? process.env.SOLANA_RPC_PRIMARY ?? "https://api.mainnet-beta.solana.com";
  const cycleId = `cycle_${Date.now()}`;
  const stages = [];
  const startedAt = new Date().toISOString();

  const slot = await rpcCall(rpc, "getSlot");
  stages.push(stage("discover", slot.availability === "OK" ? "CONTINUE" : "UNAVAILABLE", { slot: slot.value }));

  const mints = (opts.mints ?? process.env.PAPER_MINTS ?? "")
    .toString()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (mints.length === 0) {
    stages.push(stage("analyze", "EMPTY", { reason: "no mint universe configured" }));
  } else {
    stages.push(stage("analyze", "CONTINUE", { mints, note: "list only — no fabricated token stats" }));
  }

  const snapshot = opts.snapshot ?? { security: 0.2, smartMoney: 0.2, momentum: 0.3, holder: 0.3 };
  const weights = opts.weights ?? { security: 0.25, smartMoney: 0.25, momentum: 0.25, holder: 0.25 };
  const scored = scoreSnapshot(snapshot, weights);
  const runId = `run_${cycleId}`;
  ledger.runs.push({ runId, policyVersion: opts.policyVersion ?? "policy_v1", score: scored.score, availability: scored.availability });
  stages.push(stage("score", scored.availability === "OK" ? "CONTINUE" : "UNAVAILABLE", scored));

  const signalOn = scored.availability === "OK" && scored.score != null && scored.score >= (opts.signalFloor ?? 0.2);
  stages.push(stage("signal", signalOn ? "CONTINUE" : "BLOCK", { emitted: signalOn }));

  const jupKey = process.env.JUPITER_API_KEY;
  if (!jupKey) {
    stages.push(stage("quote", "UNAVAILABLE", { reason: "JUPITER_API_KEY missing — no invented route" }));
  } else {
    stages.push(stage("quote", "UNAVAILABLE", { reason: "jupiter adapter not invoked in this e2e (no fabricated outAmount)" }));
  }
  stages.push(stage("build", "UNAVAILABLE", { reason: "no quote — no tx bytes" }));
  stages.push(stage("simulate", "UNAVAILABLE", { reason: "no tx — simulate not called" }));

  const sizeUsd = opts.sizeUsd ?? 25;
  const risk = authorizeRisk(sizeUsd);
  stages.push(stage("risk", risk.allowed ? "CONTINUE" : "BLOCK", risk));

  const paper = {
    executed: false,
    reason: "no_quote_no_swap",
    runId,
  };
  stages.push(stage("paper_execute", "CONTINUE", paper));

  const positionOpened = false;
  stages.push(stage("position", "CONTINUE", { opened: false, reason: "no paper fill" }));

  const exit = evaluateExit({
    entryPrice: null,
    markPrice: null,
    markStatus: "UNAVAILABLE",
    killSwitchActive: false,
    remainingSizeFraction: 0,
  });
  stages.push(stage("exit", "CONTINUE", exit));

  const hadUnavailable = stages.some((s) => s.kind === "UNAVAILABLE");
  const blocked = stages.some((s) => s.kind === "BLOCK");
  const liveAttempt = {
    submitted: false,
    reason: "LIVE_MODE_OFF",
    missing: [
      "paperModePass",
      "testnetPass",
      "riskTestPass",
      "executionTestPass",
      "recoveryTestPass",
      "manualAdminApproval",
      "liveModeEnabled",
    ],
  };

  const report = {
    cycleId,
    mode,
    live: false,
    startedAt,
    finishedAt: new Date().toISOString(),
    status: blocked ? "BLOCKED" : "COMPLETED",
    riskAuthorized: risk.allowed,
    paperExecuted: false,
    positionOpened,
    hadUnavailable,
    slot: slot.value,
    slotAvailability: slot.availability,
    liveAttempt,
    stages,
  };
  ledger.cycles.push(report);
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
