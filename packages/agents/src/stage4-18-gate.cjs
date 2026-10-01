const assert = require("node:assert/strict");

function weightsValid(w) {
  const xs = [w.security, w.smartMoney, w.momentum, w.holder];
  return Math.abs(xs.reduce((a, b) => a + b, 0) - 1) < 1e-6;
}
function nudge(w, key, delta) {
  const next = { ...w };
  next[key] = Math.max(0, next[key] + delta);
  const rest = ["security", "smartMoney", "momentum", "holder"].filter((k) => k !== key);
  const restSum = rest.reduce((a, k) => a + next[k], 0);
  const scale = (1 - next[key]) / restSum;
  for (const k of rest) next[k] *= scale;
  return next;
}
function proposeFromEval(input) {
  if (input.eval.availability !== "OK") {
    return { status: "INSUFFICIENT_SAMPLE", weights: input.current };
  }
  if (!input.failureCluster) return { status: "REJECTED_UNVERIFIED", weights: input.current };
  const map = { thin_holders: "holder", weak_security: "security", momentum_fade: "momentum" };
  const weights = nudge(input.current, map[input.failureCluster], 0.05);
  return { status: "PROPOSED_INACTIVE", weights, reason: map[input.failureCluster] };
}

const current = { security: 0.25, smartMoney: 0.25, momentum: 0.25, holder: 0.25 };
assert.equal(proposeFromEval({ eval: { availability: "INSUFFICIENT_SAMPLE" }, current }).status, "INSUFFICIENT_SAMPLE");
assert.equal(proposeFromEval({ eval: { availability: "OK" }, current, failureCluster: null }).status, "REJECTED_UNVERIFIED");
const p = proposeFromEval({ eval: { availability: "OK", policyVersion: "v1" }, current, failureCluster: "thin_holders" });
assert.equal(p.status, "PROPOSED_INACTIVE");
assert.ok(p.weights.holder > current.holder);
assert.equal(weightsValid(p.weights), true);

console.log("Stage 4 §18 proposal unit checks: PASS");
