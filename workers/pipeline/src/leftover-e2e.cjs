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
  assert.equal(report.paperExecuted, false);
  assert.equal(report.liveAttempt.submitted, false);
  assert.equal(report.liveAttempt.reason, "LIVE_MODE_OFF");
  assert.equal(report.positionOpened, false);
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
  assert.equal(report.stages.find((s) => s.stage === "quote").kind, "UNAVAILABLE");
  assert.equal(report.stages.find((s) => s.stage === "analyze").kind, "EMPTY");
  assert.equal(readiness().productionReady, false);
  assert.equal(readiness().manualAdminApproval, null);
  assert.ok(ledger.cycles.length >= 1);

  const apiPath = path.join(root, "apps/api/src/server.mjs");
  const child = spawn(process.execPath, [apiPath], {
    env: { ...process.env, PORT: "34567", TRADING_MODE: "PAPER" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((r) => setTimeout(r, 400));

  const health = await fetch("http://127.0.0.1:34567/health").then((r) => r.json());
  assert.equal(health.tradingMode, "PAPER");
  assert.equal(health.live, false);
  const ready = await fetch("http://127.0.0.1:34567/v1/readiness").then((r) => r.json());
  assert.equal(ready.data.liveModeEnabled, false);
  const cycle = await fetch("http://127.0.0.1:34567/v1/pipeline/cycle", { method: "POST" }).then((r) => r.json());
  assert.equal(cycle.data.paperExecuted, false);
  const funnel = await fetch("http://127.0.0.1:34567/v1/funnel").then((r) => r.json());
  assert.ok(funnel.status === "OK" || funnel.status === "EMPTY");

  child.kill();
  console.log(
    `PAPER leftover wiring e2e: PASS slot=${report.slot ?? "null"} slot_avail=${report.slotAvailability} stages=11 no_fill`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
