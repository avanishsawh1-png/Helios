const assert = require("node:assert/strict");

const FORBIDDEN = [/manualAdminApproval/, /Wave\s*36/, /failOpenOnAuth/, /CROSSSLOT/];

function reviewChange(diff) {
  const blob = `${diff.path}\n${diff.patch}`;
  const hits = [];
  if (/\.env/.test(diff.path) && /PRIVATE|SECRET|SEED/i.test(diff.patch)) hits.push("secrets-in-env");
  if (/wallet/.test(diff.path) && /helios/.test(diff.path)) hits.push("wallet-inside-helios-session");
  for (const re of FORBIDDEN) {
    if (re.test(blob)) hits.push(re.source);
  }
  return { allowed: hits.length === 0, hits };
}

assert.equal(reviewChange({ path: "docs/x.md", patch: "note" }).allowed, true);
assert.equal(reviewChange({ path: "apps/api/src/x.ts", patch: "manualAdminApproval = true" }).allowed, false);
assert.equal(reviewChange({ path: "docs/plan.md", patch: "Build Wave 36 now" }).allowed, false);
assert.equal(reviewChange({ path: ".env.vps", patch: "PRIVATE_KEY=abc" }).allowed, false);
assert.equal(reviewChange({ path: "packages/agents/src/x.ts", patch: "CROSSSLOT lua" }).allowed, false);

console.log("Wave 32 change guardrails unit checks: PASS");
