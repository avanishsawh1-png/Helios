const assert = require("node:assert/strict");

function checkEmptyVsUnavailable(panelAvailability, alertFeedIsNull) {
  return {
    id: "empty-vs-unavailable",
    ok: alertFeedIsNull ? panelAvailability === "UNAVAILABLE" : true,
    detail: panelAvailability,
  };
}
function checkCandidateUnderHard(candidate, validatePreset) {
  const v = validatePreset(candidate);
  return { id: "candidate-under-hard", ok: v.status === "ACCEPTED_CANDIDATE", detail: v.status };
}

assert.equal(checkEmptyVsUnavailable("UNAVAILABLE", true).ok, true);
assert.equal(checkEmptyVsUnavailable("EMPTY", true).ok, false);
assert.equal(checkEmptyVsUnavailable("EMPTY", false).ok, true);

assert.equal(
  checkCandidateUnderHard({ maxPositionUsd: 100 }, () => ({ status: "ACCEPTED_CANDIDATE" })).ok,
  true,
);
assert.equal(
  checkCandidateUnderHard({ maxPositionUsd: 999 }, () => ({ status: "REJECTED_EXCEEDS_HARD" })).ok,
  false,
);

console.log("Wave 31 consistency unit checks: PASS");
