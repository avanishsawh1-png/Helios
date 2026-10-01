const assert = require("node:assert/strict");

function outcomeFromExit(input) {
  if (!input.runId) return { rejected: true, reason: "missing_run_id" };
  let pnlAvailability = "OK";
  let realized = input.realizedPnlPct;
  if (!input.markOk) {
    pnlAvailability = "UNAVAILABLE";
    realized = null;
  } else if (realized === null) {
    pnlAvailability = "EMPTY";
  }
  return {
    runId: input.runId,
    policyVersion: input.policyVersion,
    realizedPnlPct: realized,
    pnlAvailability,
    exitReason: input.exitReason,
    timeInPositionMs: input.timeInPositionMs,
  };
}

assert.deepEqual(outcomeFromExit({ runId: null, policyVersion: "v1", realizedPnlPct: 1, exitReason: "TP", timeInPositionMs: 1, markOk: true }), {
  rejected: true,
  reason: "missing_run_id",
});

const ok = outcomeFromExit({
  runId: "run_1",
  policyVersion: "v1",
  realizedPnlPct: 2.5,
  exitReason: "TAKE_PROFIT",
  timeInPositionMs: 60_000,
  markOk: true,
});
assert.equal(ok.realizedPnlPct, 2.5);
assert.equal(ok.pnlAvailability, "OK");

const stale = outcomeFromExit({
  runId: "run_2",
  policyVersion: "v1",
  realizedPnlPct: 9,
  exitReason: "TIME_STOP",
  timeInPositionMs: 1,
  markOk: false,
});
assert.equal(stale.realizedPnlPct, null);
assert.equal(stale.pnlAvailability, "UNAVAILABLE");

const empty = outcomeFromExit({
  runId: "run_3",
  policyVersion: "v1",
  realizedPnlPct: null,
  exitReason: null,
  timeInPositionMs: null,
  markOk: true,
});
assert.equal(empty.pnlAvailability, "EMPTY");
assert.equal(empty.realizedPnlPct, null);

console.log("Stage 3 §15 outcome link unit checks: PASS");
