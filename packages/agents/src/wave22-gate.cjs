const assert = require("node:assert/strict");

const HARD = { maxPositionUsd: 250, maxExposurePct: 25, maxDailyLossUsd: 100, minStopLossPct: 5 };
function validatePreset(c) {
  if (c.maxPositionUsd > HARD.maxPositionUsd || c.stopLossPct < HARD.minStopLossPct) {
    return { status: "REJECTED_EXCEEDS_HARD" };
  }
  return { status: "ACCEPTED_CANDIDATE" };
}
function compareDirection(current, next) {
  const looser =
    next.maxPositionUsd > current.maxPositionUsd ||
    next.maxExposurePct > current.maxExposurePct ||
    next.maxDailyLossUsd > current.maxDailyLossUsd ||
    next.stopLossPct < current.stopLossPct;
  const tighter =
    next.maxPositionUsd < current.maxPositionUsd ||
    next.maxExposurePct < current.maxExposurePct ||
    next.maxDailyLossUsd < current.maxDailyLossUsd ||
    next.stopLossPct > current.stopLossPct;
  if (looser && !tighter) return "loosen";
  if (tighter && !looser) return "tighten";
  if (!looser && !tighter) return "unchanged";
  return "loosen";
}

function stagePresetChange(req) {
  if (req.actor !== "human") return { status: "REJECTED", reason: "agent_cannot_stage", delayMs: 0 };
  if (req.killSwitchActive) return { status: "REJECTED", reason: "kill_switch_lock", delayMs: 0 };
  if (validatePreset(req.next).status !== "ACCEPTED_CANDIDATE") {
    return { status: "REJECTED", reason: "REJECTED_EXCEEDS_HARD", delayMs: 0 };
  }
  const dir = compareDirection(req.current, req.next);
  if (dir === "unchanged") return { status: "REJECTED", reason: "unchanged", delayMs: 0 };
  if (dir === "tighten") {
    return { status: req.mode === "PAPER" ? "APPLIED_TIGHTEN_PAPER" : "STAGED", reason: "tighten", delayMs: 0 };
  }
  if (req.confirmToken !== "CONFIRM") return { status: "REJECTED", reason: "confirm_token_required", delayMs: 0 };
  if (req.mode !== "PAPER") return { status: "STAGED", reason: "loosen_delayed", delayMs: 3_600_000 };
  return { status: "STAGED", reason: "loosen_paper_confirm", delayMs: 0 };
}

const cur = { id: "c", maxPositionUsd: 100, maxExposurePct: 10, maxDailyLossUsd: 40, stopLossPct: 8 };
const tight = { ...cur, id: "t", maxPositionUsd: 80 };
const loose = { ...cur, id: "l", maxPositionUsd: 120 };

assert.equal(stagePresetChange({ actor: "agent", mode: "PAPER", current: cur, next: tight }).reason, "agent_cannot_stage");
assert.equal(stagePresetChange({ actor: "human", mode: "PAPER", current: cur, next: tight }).status, "APPLIED_TIGHTEN_PAPER");
assert.equal(stagePresetChange({ actor: "human", mode: "PAPER", current: cur, next: loose }).reason, "confirm_token_required");
assert.equal(
  stagePresetChange({ actor: "human", mode: "PAPER", current: cur, next: loose, confirmToken: "CONFIRM" }).reason,
  "loosen_paper_confirm",
);
assert.equal(
  stagePresetChange({ actor: "human", mode: "LIVE", current: cur, next: loose, confirmToken: "CONFIRM" }).delayMs,
  3_600_000,
);
assert.equal(stagePresetChange({ actor: "human", mode: "PAPER", current: cur, next: tight, killSwitchActive: true }).reason, "kill_switch_lock");

console.log("Wave 22 staging + loosening guards unit checks: PASS");
