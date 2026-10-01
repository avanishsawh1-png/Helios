const assert = require("node:assert/strict");

class HardLimitRiskPort {
  constructor(maxSizeUsd) {
    this.maxSizeUsd = maxSizeUsd;
  }
  authorize(intent) {
    if (intent.sizeUsd === null) return { allowed: false, reason: "size_unknown" };
    if (intent.sizeUsd > this.maxSizeUsd) return { allowed: false, reason: "hard_limit" };
    return { allowed: true, reason: "ok" };
  }
}

class ObservingRiskPort {
  constructor(inner, hook) {
    this.inner = inner;
    this.hook = hook;
    this.hookErrors = 0;
    this.observations = 0;
  }
  authorize(intent) {
    const decision = this.inner.authorize(intent);
    try {
      this.observations += 1;
      if (this.hook) this.hook(decision);
    } catch (_) {
      this.hookErrors += 1;
    }
    return decision;
  }
}

const inner = new HardLimitRiskPort(100);
const throwing = new ObservingRiskPort(inner, () => {
  throw new Error("agent hook");
});

const a = inner.authorize({ sizeUsd: 50 });
const b = throwing.authorize({ sizeUsd: 50 });
assert.deepEqual({ allowed: a.allowed, reason: a.reason }, { allowed: b.allowed, reason: b.reason });
assert.equal(throwing.hookErrors, 1);

const deny = throwing.authorize({ sizeUsd: 500 });
assert.equal(deny.allowed, false);
assert.equal(deny.reason, "hard_limit");

const unknown = throwing.authorize({ sizeUsd: null });
assert.equal(unknown.allowed, false);
assert.equal(unknown.reason, "size_unknown");

assert.equal(throwing.observations, 3);
console.log("Wave 14 risk observe wiring unit checks: PASS");
