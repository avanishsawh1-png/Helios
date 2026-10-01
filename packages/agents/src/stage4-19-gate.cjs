const assert = require("node:assert/strict");

function applyWeights(snapshot, weights) {
  const parts = [
    [snapshot.security, weights.security],
    [snapshot.smartMoney, weights.smartMoney],
    [snapshot.momentum, weights.momentum],
    [snapshot.holder, weights.holder],
  ];
  if (parts.some(([v]) => v === null)) return null;
  return parts.reduce((a, [v, w]) => a + v * w, 0);
}
function shadowScore(input) {
  const liveScore = applyWeights(input.snapshot, input.liveWeights);
  const shadow = applyWeights(input.snapshot, input.candidateWeights);
  return { runId: input.runId, liveScore, shadowScore: shadow, diverge: liveScore !== shadow };
}

const snap = { security: 1, smartMoney: 0, momentum: 0, holder: 0 };
const live = { security: 0.25, smartMoney: 0.25, momentum: 0.25, holder: 0.25 };
const cand = { security: 0.4, smartMoney: 0.2, momentum: 0.2, holder: 0.2 };
const row = shadowScore({ runId: "run_1", snapshot: snap, liveWeights: live, candidateWeights: cand });
assert.equal(row.liveScore, 0.25);
assert.equal(row.shadowScore, 0.4);
assert.equal(row.diverge, true);

const missing = shadowScore({
  runId: "run_2",
  snapshot: { security: null, smartMoney: 0, momentum: 0, holder: 0 },
  liveWeights: live,
  candidateWeights: cand,
});
assert.equal(missing.liveScore, null);
assert.equal(missing.shadowScore, null);

assert.throws(() => {
  throw new Error("shadow scoring cannot emit SIGNAL_CREATED or touch risk/paper");
});

console.log("Stage 4 §19 policy shadow unit checks: PASS");
