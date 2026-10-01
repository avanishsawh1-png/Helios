const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "../../..");

async function main() {
  const { runPaperCycle, readiness, assertPaper, ledger } = await import(
    path.join(root, "workers/pipeline/src/paper-system.mjs")
  );

  assert.throws(() => assertPaper("LIVE"));
  const report = await runPaperCycle({ mode: "PAPER" });
  assert.equal(report.live, false);
  assert.equal(report.liveAttempt.submitted, false);
  assert.equal(report.liveAttempt.gate?.allowed, false);
  const analyze0 = report.stages.find((s) => s.stage === "analyze");
  if (analyze0.kind !== "CONTINUE") {
    assert.equal(report.stages.find((s) => s.stage === "score").kind, "UNAVAILABLE");
    assert.equal(report.stages.find((s) => s.stage === "signal").kind, "BLOCK");
    assert.equal(report.paperExecuted, false);
  }
  assert.equal(report.positionOpened, report.paperExecuted);
  const quote = report.stages.find((s) => s.stage === "quote");
  assert.ok(["CONTINUE", "EMPTY", "UNAVAILABLE"].includes(quote.kind), quote.kind);
  const build = report.stages.find((s) => s.stage === "build");
  const simulate = report.stages.find((s) => s.stage === "simulate");
  if (build.kind !== "CONTINUE" || simulate.kind !== "CONTINUE") {
    assert.equal(report.paperExecuted, false);
  }
  assert.equal(report.stages.length, 11);
  const names = report.stages.map((s) => s.stage);
  assert.deepEqual(names, [
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
  ]);
  const analyze = report.stages.find((s) => s.stage === "analyze");
  assert.ok(["EMPTY", "CONTINUE", "UNAVAILABLE"].includes(analyze.kind), analyze.kind);
  const listed = await runPaperCycle({
    mode: "PAPER",
    mints: "So11111111111111111111111111111111111111112",
  });
  assert.equal(listed.stages.find((s) => s.stage === "analyze").kind, "CONTINUE");
  const rankedCycle = await runPaperCycle({
    mode: "PAPER",
    mints: "So11111111111111111111111111111111111111112,EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    features: {
      So11111111111111111111111111111111111111112: { security: 0.1, smartMoney: 0.1, momentum: 0.1, holder: 0.1 },
      EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: { security: 0.9, smartMoney: 0.9, momentum: 0.9, holder: 0.9 },
    },
  });
  assert.equal(rankedCycle.stages.find((s) => s.stage === "signal").top.mint, "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  assert.equal(rankedCycle.liveAttempt.submitted, false);
  assert.equal(rankedCycle.reconciliation.ok, true);
  assert.equal(readiness().productionReady, false);
  assert.equal(readiness().manualAdminApproval, null);
  assert.ok(ledger.cycles.length >= 1);

  const apiPath = path.join(root, "apps/api/src/server.mjs");
  const child = spawn(process.execPath, [apiPath], {
    env: {
      ...process.env,
      PORT: "34571",
      TRADING_MODE: "PAPER",
      NODE_ENV: "test",
      HELIOS_BOOT_OPERATOR_TOKEN: "op-e2e",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((r) => setTimeout(r, 800));

  const health = await fetch("http://127.0.0.1:34571/health").then((r) => r.json());
  assert.equal(health.tradingMode, "PAPER");
  assert.equal(health.live, false);
  const denied = await fetch("http://127.0.0.1:34571/v1/pipeline/cycle", { method: "POST" });
  assert.equal(denied.status, 401);
  const auth = { authorization: "Bearer op-e2e" };
  const ready = await fetch("http://127.0.0.1:34571/v1/readiness").then((r) => r.json());
  assert.ok(ready.data, JSON.stringify(ready));
  assert.equal(ready.data.liveModeEnabled, false);
  const bal = await fetch("http://127.0.0.1:34571/v1/balances").then((r) => r.json());
  assert.equal(bal.data.liveTradingEnabled, false);
  assert.ok(bal.data.paper);
  assert.ok(bal.data.live);
  const cycle = await fetch("http://127.0.0.1:34571/v1/pipeline/cycle", { method: "POST", headers: auth }).then((r) => r.json());
  assert.equal(cycle.data.liveAttempt.submitted, false);
  const funnel = await fetch("http://127.0.0.1:34571/v1/funnel", { headers: auth }).then((r) => r.json());
  assert.ok(funnel.status === "OK" || funnel.status === "EMPTY");

  child.kill();
  console.log(
    `PAPER leftover wiring e2e: PASS slot=${report.slot ?? "null"} paperExecuted=${report.paperExecuted} liveSubmitted=false`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
