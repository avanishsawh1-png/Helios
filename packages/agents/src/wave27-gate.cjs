const assert = require("node:assert/strict");

function shadowCompare(live, shadow, intentSizeUsd) {
  return {
    intentSizeUsd,
    live,
    shadow,
    diverge: live.allowed !== shadow.allowed || live.reason !== shadow.reason,
  };
}
function applyShadow() {
  throw new Error("shadow cannot write RiskPort / positions / orders");
}

const same = shadowCompare({ allowed: true, reason: "ok" }, { allowed: true, reason: "ok" }, 50);
assert.equal(same.diverge, false);
const div = shadowCompare({ allowed: true, reason: "ok" }, { allowed: false, reason: "hard_limit" }, 200);
assert.equal(div.diverge, true);
assert.equal(div.intentSizeUsd, 200);
assert.throws(() => applyShadow());

console.log("Wave 27 shadow mode unit checks: PASS");
