const assert = require("node:assert/strict");

function handleStagePreset(req, stageFn) {
  const canConfig = req.role === "admin" || req.role === "operator";
  if (!canConfig) return { status: 403, body: { correlationId: req.correlationId, error: "forbidden" } };
  if (req.body.actor !== "human") {
    return { status: 403, body: { correlationId: req.correlationId, error: "actor_must_be_human" } };
  }
  const result = stageFn(req.body);
  return { status: result.status === "REJECTED" ? 400 : 200, body: { correlationId: req.correlationId, result } };
}

const body = {
  actor: "human",
  mode: "PAPER",
  current: { id: "c", maxPositionUsd: 100, maxExposurePct: 10, maxDailyLossUsd: 40, stopLossPct: 8 },
  next: { id: "t", maxPositionUsd: 80, maxExposurePct: 10, maxDailyLossUsd: 40, stopLossPct: 8 },
};

const stageFn = () => ({ status: "APPLIED_TIGHTEN_PAPER", reason: "tighten", delayMs: 0 });

assert.equal(handleStagePreset({ role: "viewer", correlationId: "c1", body }, stageFn).status, 403);
assert.equal(handleStagePreset({ role: "agent", correlationId: "c2", body }, stageFn).status, 403);
assert.equal(
  handleStagePreset({ role: "admin", correlationId: "c3", body: { ...body, actor: "agent" } }, stageFn).status,
  403,
);
const ok = handleStagePreset({ role: "operator", correlationId: "c4", body }, stageFn);
assert.equal(ok.status, 200);
assert.equal(ok.body.correlationId, "c4");
assert.equal(ok.body.result.status, "APPLIED_TIGHTEN_PAPER");

const rejected = handleStagePreset({ role: "admin", correlationId: "c5", body }, () => ({
  status: "REJECTED",
  reason: "confirm_token_required",
  delayMs: 0,
}));
assert.equal(rejected.status, 400);

console.log("Wave 23 preset RBAC routes unit checks: PASS");
