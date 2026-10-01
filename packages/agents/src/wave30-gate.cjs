const assert = require("node:assert/strict");

function promoteCandidate(store, req, stagePresetChange) {
  if (req.actor !== "human") return { status: "REJECTED", reason: "agent_cannot_promote" };
  const row = store.get(req.candidateId);
  if (!row) return { status: "REJECTED", reason: "not_found" };
  return stagePresetChange({
    actor: req.actor,
    mode: req.mode,
    current: req.current,
    next: row.candidate,
    confirmToken: req.confirmToken,
    killSwitchActive: req.killSwitchActive,
  });
}

const current = { id: "c", maxPositionUsd: 100, maxExposurePct: 10, maxDailyLossUsd: 40, stopLossPct: 8 };
const store = {
  get(id) {
    if (id !== "p1") return null;
    return { candidate: { ...current, id: "p1", maxPositionUsd: 80 }, active: false };
  },
};

assert.equal(
  promoteCandidate(store, { actor: "agent", mode: "PAPER", candidateId: "p1", current }, () => ({})).reason,
  "agent_cannot_promote",
);
assert.equal(
  promoteCandidate(store, { actor: "human", mode: "PAPER", candidateId: "missing", current }, () => ({})).reason,
  "not_found",
);

const ok = promoteCandidate(
  store,
  { actor: "human", mode: "PAPER", candidateId: "p1", current },
  () => ({ status: "APPLIED_TIGHTEN_PAPER", reason: "tighten", delayMs: 0 }),
);
assert.equal(ok.status, "APPLIED_TIGHTEN_PAPER");

console.log("Wave 30 promotion unit checks: PASS");
