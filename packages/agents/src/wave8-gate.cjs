const assert = require("node:assert/strict");

const PROTECTED_TARGETS = [
  "manualAdminApproval",
  "section70",
  "killSwitch",
  "risk_limits",
  "HardRiskLimits",
  "TRADING_MODE",
  "wallet",
  "signer",
  "secrets",
  "auth",
  "rbac",
  "GATEWAY_CONFIG_WHITELIST",
  "db_roles",
  "ProductionGate.verified",
  ".env",
  "agent_config",
  "promotion_approval",
  "shadow_mode_toggle",
];

function isProtectedTarget(name) {
  const n = name.trim();
  return PROTECTED_TARGETS.some((t) => n === t || n.startsWith(t + ".") || n.startsWith(t + "/"));
}

const FORBIDDEN = ["RiskPort", "ExecutionAuthorization", "recordExit", "TransactionSigner", "order_write", "position_write"];

function assertAdvisoryOnly(proposal) {
  if (isProtectedTarget(proposal.target)) throw new Error("AGENT_OS_BOUNDARY:protected");
  for (const needle of FORBIDDEN) {
    if (proposal.target.includes(needle) || proposal.body.includes(needle)) {
      throw new Error("AGENT_OS_BOUNDARY:wiring");
    }
  }
  if (!proposal.evidenceRefs.length) throw new Error("AGENT_OS_BOUNDARY:unverified");
}

function applyProposal() {
  throw new Error("AGENT_OS_BOUNDARY:auto-apply");
}

assert.equal(isProtectedTarget("manualAdminApproval"), true);
assert.equal(isProtectedTarget("wallet/keystore"), true);
assert.equal(isProtectedTarget("docs/readme"), false);

assert.throws(() =>
  assertAdvisoryOnly({
    tier: 1,
    title: "tighten",
    body: "wire RiskPort",
    target: "docs/note",
    evidenceRefs: ["e1"],
  }),
);

assert.throws(() =>
  assertAdvisoryOnly({
    tier: 1,
    title: "x",
    body: "ok",
    target: "TRADING_MODE",
    evidenceRefs: ["e1"],
  }),
);

assert.throws(() =>
  assertAdvisoryOnly({
    tier: 1,
    title: "x",
    body: "ok",
    target: "docs/note",
    evidenceRefs: [],
  }),
);

assertAdvisoryOnly({
  tier: 1,
  title: "observe funnel",
  body: "counts only",
  target: "pipeline_funnel",
  evidenceRefs: ["tool:funnel:1"],
});

assert.throws(() => applyProposal());

console.log("Wave 8 Agent OS charter + boundary unit checks: PASS");
