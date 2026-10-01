const assert = require("node:assert/strict");

function weightsValid(w) {
  const xs = [w.security, w.smartMoney, w.momentum, w.holder];
  if (xs.some((x) => !Number.isFinite(x) || x < 0)) return false;
  return Math.abs(xs.reduce((a, b) => a + b, 0) - 1) < 1e-6;
}

class PolicyVersionStore {
  constructor() {
    this.rows = new Map();
  }
  insert(row) {
    if (!weightsValid(row.weights)) throw new Error("invalid_weights");
    if (row.active && row.createdBy !== "human") throw new Error("agent_cannot_activate");
    if (row.active) {
      for (const r of this.rows.values()) r.active = false;
    }
    this.rows.set(row.policyVersion, { ...row, weights: { ...row.weights } });
    return this.rows.get(row.policyVersion);
  }
  active() {
    return [...this.rows.values()].find((r) => r.active) ?? null;
  }
}

const store = new PolicyVersionStore();
const w = { security: 0.25, smartMoney: 0.25, momentum: 0.25, holder: 0.25 };
store.insert({ policyVersion: "v1", weights: w, active: false, createdBy: "agent" });
assert.equal(store.active(), null);
assert.throws(() => store.insert({ policyVersion: "v2", weights: w, active: true, createdBy: "agent" }));
store.insert({ policyVersion: "v2", weights: w, active: true, createdBy: "human" });
assert.equal(store.active().policyVersion, "v2");
assert.throws(() =>
  store.insert({ policyVersion: "bad", weights: { security: 2, smartMoney: 0, momentum: 0, holder: 0 }, active: false, createdBy: "human" }),
);

console.log("Stage 4 §17 policy versions unit checks: PASS");
