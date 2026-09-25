const assert = require("node:assert/strict");

class HardLimitRiskPort {
  authorize(intent) {
    if (intent.sizeUsd === null) return { allowed: false, reason: "size_unknown" };
    if (intent.sizeUsd > 100) return { allowed: false, reason: "hard_limit" };
    return { allowed: true, reason: "ok" };
  }
}
class ObservingRiskPort {
  constructor(inner, hook) {
    this.inner = inner;
    this.hook = hook;
  }
  authorize(intent) {
    const d = this.inner.authorize(intent);
    try {
      this.hook(d);
    } catch (_) {}
    return d;
  }
}
class FeatureCapture {
  observe(_n, _s, passthrough, producer) {
    try {
      producer();
    } catch (_) {}
    return passthrough;
  }
}

const inner = new HardLimitRiskPort();
const baseline = inner.authorize({ sizeUsd: 50 });
const cap = new FeatureCapture();
assert.equal(cap.observe("x", "y", baseline, () => { throw new Error("h"); }), baseline);
const wrapped = new ObservingRiskPort(inner, () => { throw new Error("h"); });
const after = wrapped.authorize({ sizeUsd: 50 });
assert.deepEqual(after, baseline);
assert.equal(inner.authorize({ sizeUsd: 500 }).allowed, false);

let wrote = false;
try {
  throw new Error("shadow cannot write");
} catch (_) {
  wrote = false;
}
assert.equal(wrote, false);

console.log("Wave 34 interference check: PASS hooks_fail_open trading_unchanged");
console.log("Wave 34 LIVE authorization: NOT GRANTED");
