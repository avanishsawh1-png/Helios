const assert = require("node:assert/strict");

function formatField(value) {
  return value === null || Number.isNaN(value) ? "—" : String(value);
}
function canSubmit(state) {
  return state.canConfig && state.draftMaxPositionUsd !== null;
}
function submitDraft(state) {
  if (!state.canConfig) return { ok: false, error: "forbidden" };
  if (state.draftMaxPositionUsd === null) return { ok: false, error: "unknown_draft" };
  if (state.draftMaxPositionUsd > state.hardMaxPositionUsd) return { ok: false, error: "exceeds_hard" };
  return { ok: true, error: null };
}

assert.equal(formatField(null), "—");
assert.equal(formatField(80), "80");
assert.equal(canSubmit({ canConfig: false, draftMaxPositionUsd: 80, hardMaxPositionUsd: 250 }), false);
assert.equal(canSubmit({ canConfig: true, draftMaxPositionUsd: null, hardMaxPositionUsd: 250 }), false);
assert.equal(submitDraft({ canConfig: true, draftMaxPositionUsd: 300, hardMaxPositionUsd: 250 }).error, "exceeds_hard");
assert.equal(submitDraft({ canConfig: true, draftMaxPositionUsd: 80, hardMaxPositionUsd: 250 }).ok, true);
assert.equal(submitDraft({ canConfig: false, draftMaxPositionUsd: 80, hardMaxPositionUsd: 250 }).error, "forbidden");

console.log("Wave 24 preset editor unit checks: PASS");
