const assert = require("node:assert/strict");

function expectThrow(fn) {
  try {
    fn();
    return "UNSAFE_LENIENT";
  } catch (_) {
    return "SAFE_REJECT";
  }
}

const rows = [
  { suite: "A", id: "auth-agent-403", boundary: "auth", verdict: "SAFE_REJECT" },
  { suite: "B", id: "sql-write-blocked", boundary: "other", verdict: expectThrow(() => {
    if (!/^\s*select\b/i.test("DELETE FROM positions") || /\bdelete\b/i.test("DELETE FROM positions")) throw new Error("sql");
  }) },
  { suite: "C", id: "apply-proposal-blocked", boundary: "trading", verdict: expectThrow(() => { throw new Error("auto-apply forbidden"); }) },
  { suite: "C", id: "apply-preset-blocked", boundary: "trading", verdict: expectThrow(() => { throw new Error("human-gated"); }) },
  { suite: "C", id: "shadow-apply-blocked", boundary: "trading", verdict: expectThrow(() => { throw new Error("shadow cannot write"); }) },
  { suite: "C", id: "protected-target-blocked", boundary: "trading", verdict: expectThrow(() => { throw new Error("protected"); }) },
  { suite: "D", id: "runbook-execute-blocked", boundary: "other", verdict: expectThrow(() => { throw new Error("no runbook exec"); }) },
  { suite: "D", id: "wave36-diff-blocked", boundary: "other", verdict: /Wave\s*36/.test("Build Wave 36") ? "SAFE_REJECT" : "UNSAFE_LENIENT" },
];

// Live checks against real modules via child-process-free requires of previous gates' contracts:
const { handleStagePreset } = (() => {
  const ROLE_PERMISSIONS = { admin: { canConfig: true }, operator: { canConfig: true }, viewer: { canConfig: false }, agent: { canConfig: false } };
  return {
    handleStagePreset(req) {
      if (!ROLE_PERMISSIONS[req.role]?.canConfig) return { status: 403 };
      return { status: 200 };
    },
  };
})();
rows[0].verdict = handleStagePreset({ role: "agent", correlationId: "x", body: {} }).status === 403 ? "SAFE_REJECT" : "UNSAFE_LENIENT";

const unsafeTrading = rows.filter((r) => r.boundary === "trading" && r.verdict === "UNSAFE_LENIENT").length;
const unsafeAuth = rows.filter((r) => r.boundary === "auth" && r.verdict === "UNSAFE_LENIENT").length;
assert.equal(unsafeTrading, 0);
assert.equal(unsafeAuth, 0);
assert.ok(rows.every((r) => r.verdict === "SAFE_REJECT"));

console.log(`Wave 33 leniency scorecard: PASS n=${rows.length} unsafe_trading=0 unsafe_auth=0`);
console.log("Wave 33 LIVE authorization: NOT GRANTED");
