const assert = require("node:assert/strict");

const ORDER = ["discover", "score", "signal", "risk", "simulate", "paper_fill", "exit"];

function traceTrade(input) {
  const mode = input.mode ?? "UNKNOWN";
  if (!input.evidence.length) {
    return { positionId: input.positionId, mode, stages: [], complete: false, evidence: [], status: "REJECTED_UNVERIFIED" };
  }
  if (mode === "LIVE") {
    return { positionId: input.positionId, mode, stages: [], complete: false, evidence: input.evidence, status: "REFUSED_LIVE" };
  }
  const stages = ORDER.map((name) => input.stages[name] ?? { name, availability: "UNAVAILABLE", at: null, note: "not yet wired" });
  const complete = stages.every((s) => s.availability === "OK");
  return {
    positionId: input.positionId,
    mode: mode === "UNKNOWN" ? "UNKNOWN" : "PAPER",
    stages,
    complete,
    evidence: input.evidence,
    status: complete ? "TRACED" : "INCONCLUSIVE",
  };
}

const ev = [{ toolCallId: "t1", source: "positions" }];
assert.equal(traceTrade({ positionId: "p1", mode: "PAPER", stages: {}, evidence: [] }).status, "REJECTED_UNVERIFIED");
assert.equal(traceTrade({ positionId: "p1", mode: "LIVE", stages: {}, evidence: ev }).status, "REFUSED_LIVE");

const partial = traceTrade({
  positionId: "p1",
  mode: "PAPER",
  stages: { discover: { name: "discover", availability: "OK", at: "t", note: "mint" } },
  evidence: ev,
});
assert.equal(partial.status, "INCONCLUSIVE");
assert.equal(partial.complete, false);
assert.equal(partial.stages.length, 7);
assert.equal(partial.stages.filter((s) => s.availability === "UNAVAILABLE").length, 6);

const fullStages = Object.fromEntries(
  ORDER.map((name) => [name, { name, availability: "OK", at: "t", note: name }]),
);
const full = traceTrade({ positionId: "p1", mode: "PAPER", stages: fullStages, evidence: ev });
assert.equal(full.status, "TRACED");
assert.equal(full.complete, true);

console.log("Wave 19 trade-trace unit checks: PASS");
