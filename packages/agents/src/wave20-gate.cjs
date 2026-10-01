const assert = require("node:assert/strict");

const HARD = { maxPositionUsd: 250, maxExposurePct: 25, maxDailyLossUsd: 100, minStopLossPct: 5 };

function validatePreset(c, hard = HARD) {
  const reasons = [];
  if (!(c.maxPositionUsd > 0) || !(c.maxExposurePct > 0) || !(c.stopLossPct > 0)) {
    return { status: "REJECTED_INVALID", reasons: ["non_positive_field"] };
  }
  if (c.maxPositionUsd > hard.maxPositionUsd) reasons.push("maxPositionUsd");
  if (c.maxExposurePct > hard.maxExposurePct) reasons.push("maxExposurePct");
  if (c.maxDailyLossUsd > hard.maxDailyLossUsd) reasons.push("maxDailyLossUsd");
  if (c.stopLossPct < hard.minStopLossPct) reasons.push("stopLossPct_looser_than_hard");
  if (reasons.length) return { status: "REJECTED_EXCEEDS_HARD", reasons };
  return { status: "ACCEPTED_CANDIDATE", reasons: [] };
}

function applyPreset() {
  throw new Error("preset apply is human-gated");
}

assert.equal(
  validatePreset({ id: "ok", maxPositionUsd: 100, maxExposurePct: 10, maxDailyLossUsd: 50, stopLossPct: 8 }).status,
  "ACCEPTED_CANDIDATE",
);
assert.equal(
  validatePreset({ id: "big", maxPositionUsd: 999, maxExposurePct: 10, maxDailyLossUsd: 50, stopLossPct: 8 }).status,
  "REJECTED_EXCEEDS_HARD",
);
assert.ok(
  validatePreset({ id: "loose-sl", maxPositionUsd: 100, maxExposurePct: 10, maxDailyLossUsd: 50, stopLossPct: 2 }).reasons.includes(
    "stopLossPct_looser_than_hard",
  ),
);
assert.equal(
  validatePreset({ id: "bad", maxPositionUsd: 0, maxExposurePct: 10, maxDailyLossUsd: 50, stopLossPct: 8 }).status,
  "REJECTED_INVALID",
);
assert.throws(() => applyPreset());

console.log("Wave 20 preset validation unit checks: PASS");
