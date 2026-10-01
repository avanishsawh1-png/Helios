const assert = require("node:assert/strict");

function attachRunMeta(input) {
  const values = [input.snapshot.security, input.snapshot.smartMoney, input.snapshot.momentum, input.snapshot.holder];
  const availability = values.every((v) => v === null) ? "EMPTY" : input.score === null ? "UNAVAILABLE" : "OK";
  return {
    runId: input.runId ?? "run_fixed",
    policyVersion: input.policyVersion,
    snapshot: input.snapshot,
    score: availability === "OK" ? input.score : null,
    availability,
    event: input.event,
    at: input.at ?? "t",
  };
}

const snap = { security: 0.2, smartMoney: 0.1, momentum: 0.4, holder: 0.3 };
const scoreEv = attachRunMeta({
  policyVersion: "policy_v1",
  snapshot: snap,
  score: 0.55,
  event: "SCORE_CREATED",
  runId: "run_1",
});
assert.equal(scoreEv.runId, "run_1");
assert.equal(scoreEv.policyVersion, "policy_v1");
assert.equal(scoreEv.event, "SCORE_CREATED");
assert.equal(scoreEv.score, 0.55);

const empty = attachRunMeta({
  policyVersion: "policy_v1",
  snapshot: { security: null, smartMoney: null, momentum: null, holder: null },
  score: 0,
  event: "SCORE_CREATED",
  runId: "run_2",
});
assert.equal(empty.availability, "EMPTY");
assert.equal(empty.score, null);

const missing = attachRunMeta({
  policyVersion: "policy_v1",
  snapshot: snap,
  score: null,
  event: "SIGNAL_CREATED",
  runId: "run_1",
});
assert.equal(missing.availability, "UNAVAILABLE");
assert.equal(missing.event, "SIGNAL_CREATED");

const journal = [];
journal.push(scoreEv, missing);
assert.equal(journal.filter((r) => r.runId === "run_1").length, 2);

console.log("Stage 3 §14 run instrumentation unit checks: PASS");
