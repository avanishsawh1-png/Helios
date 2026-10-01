import http from "node:http";
import { ledger, runPaperCycle, readiness, assertPaper } from "../../../workers/pipeline/src/paper-system.mjs";
import { defaultAuthEngine } from "./auth/engine.mjs";
import { assertDatabasePasswordRotated } from "../../../packages/database/src/password-guard.mjs";
import { fetchPaperAndLiveBalances } from "../../../packages/solana/src/sol-balance.mjs";
import { isKillSwitchOn, snapshot as controlSnapshot } from "../../../services/control-gateway/src/control-state.mjs";
import { dispatchGatewayCommand } from "../../../services/control-gateway/src/commands.mjs";

const mode = assertPaper();
assertDatabasePasswordRotated(process.env.DATABASE_URL, process.env);

if (process.env.HELIOS_BOOT_OPERATOR_TOKEN) {
  defaultAuthEngine.seed(process.env.HELIOS_BOOT_OPERATOR_TOKEN, { id: "boot", role: "operator" });
}

const port = Number(process.env.PORT ?? 3000);

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

function avail(status, extra) {
  return { status, asOf: new Date().toISOString(), ...extra };
}

function protect(req, roles = ["viewer", "operator", "admin"]) {
  return defaultAuthEngine.requireRole(req.headers.authorization, roles);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  try {
    if (url.pathname === "/health" || url.pathname === "/v1/health") {
      send(res, 200, { ok: true, tradingMode: mode, live: false, service: "api" });
      return;
    }
    if (url.pathname === "/v1/status") {
      send(res, 200, avail("OK", {
        data: {
          tradingMode: mode,
          reportedMode: mode,
          live: false,
          health: "ok",
          gatewayReachable: true,
          apiVersion: "handoff",
          generatedAt: new Date().toISOString(),
        },
      }));
      return;
    }
    if (url.pathname === "/v1/readiness") {
      const r = readiness();
      send(res, 200, avail("OK", { data: { ...r, liveTradingGate: r } }));
      return;
    }
    if (url.pathname === "/v1/wallet") {
      send(res, 200, avail("OK", {
        data: {
          pubkey: process.env.PAPER_WALLET_PUBKEY ?? null,
          livePubkey: process.env.LIVE_WALLET_PUBKEY ?? process.env.EXTERNAL_PUBLIC_KEY ?? null,
          signer: "isolated_refusing",
          privateKeyLoaded: false,
        },
      }));
      return;
    }
    if (url.pathname === "/v1/live/preview" && req.method === "POST") {
      const preview = await defaultLiveEngine.execute({ mint: url.searchParams.get("mint") });
      send(res, 200, avail("OK", { data: preview }));
      return;
    }
    if (url.pathname === "/v1/balances") {
      const balances = await fetchPaperAndLiveBalances();
      const status = balances.paper.availability === "OK" || balances.live.availability === "OK" ? "OK" : balances.paper.availability;
      send(res, 200, avail(status === "OK" ? "OK" : status, { data: balances }));
      return;
    }
    const gated = ["/v1/pipeline/cycle"];
    if (gated.includes(url.pathname)) {
      const auth = protect(req, url.pathname === "/v1/pipeline/cycle" ? ["operator", "admin"] : ["viewer", "operator", "admin"]);
      if (!auth.ok) {
        send(res, auth.status, { error: auth.reason });
        return;
      }
    }
    if (url.pathname === "/v1/funnel") {
      if (!ledger.cycles.length) {
        send(res, 200, avail("EMPTY", { reason: "no cycles yet" }));
        return;
      }
      const last = ledger.cycles.at(-1);
      send(res, 200, avail("OK", {
        data: {
          cycleCount: ledger.cycles.length,
          stages: (last.stages ?? []).map((s) => ({
            stage: s.stage,
            count: s.kind === "CONTINUE" ? 1 : 0,
            kind: s.kind,
          })),
        },
      }));
      return;
    }
    if (url.pathname === "/v1/portfolio") {
      send(res, 200, avail("OK", {
        data: {
          equityUsd: null,
          realizedPnlUsd: null,
          unrealizedPnlUsd: null,
          openPositionCount: ledger.positions.length,
          unpricedOpenPositionCount: ledger.positions.filter((p) => p.markStatus !== "OK").length,
          reason: "equity_mark_usd_not_priced",
        },
      }));
      return;
    }
    if (url.pathname === "/v1/risk") {
      send(res, 200, avail("OK", {
        data: {
          killSwitch: isKillSwitchOn(),
          lifecycle: controlSnapshot().lifecycle,
          tradesToday: ledger.cycles.filter((c) => c.paperExecuted).length,
          dailyLossUsd: null,
        },
      }));
      return;
    }
    if (url.pathname === "/v1/series") {
      const points = ledger.cycles.map((c) => ({
        equityUsd: null,
        cycleId: c.cycleId,
        paperExecuted: c.paperExecuted,
      }));
      send(res, 200, avail(points.length ? "OK" : "EMPTY", {
        data: { points, equityUnknown: true },
        reason: points.length ? undefined : "no cycles",
      }));
      return;
    }
    if (url.pathname === "/v1/positions") {
      if (!ledger.positions.length) {
        send(res, 200, avail("EMPTY", { reason: "no paper positions" }));
        return;
      }
      send(res, 200, avail("OK", { data: ledger.positions }));
      return;
    }
    if (url.pathname === "/v1/control") {
      send(res, 200, avail("OK", { data: controlSnapshot() }));
      return;
    }
    if (url.pathname === "/v1/command" && req.method === "POST") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      let body = {};
      try {
        body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
      } catch {
        send(res, 400, { ok: false, reason: "invalid_json" });
        return;
      }
      const result = dispatchGatewayCommand({
        ...body,
        mode,
        apiKey: req.headers["x-api-key"] ?? body.apiKey ?? process.env.CONTROL_GATEWAY_API_KEY,
      });
      send(res, result.status, result);
      return;
    }
    if (url.pathname === "/v1/pipeline/cycle" && req.method === "POST") {
      const report = await runPaperCycle({ mode });
      send(res, 200, avail("OK", { data: report }));
      return;
    }
    send(res, 404, { error: "not_found" });
  } catch (err) {
    send(res, 500, { error: String(err?.message ?? err) });
  }
});

server.listen(port, "0.0.0.0", () => {
  process.stdout.write(`api listening ${port} TRADING_MODE=${mode} auth=on\n`);
});

export { server, defaultAuthEngine };
