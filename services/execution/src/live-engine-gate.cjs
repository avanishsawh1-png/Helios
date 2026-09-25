const assert = require("node:assert/strict");

const CLOSED = {
  paperModePass: false,
  testnetPass: false,
  riskTestPass: false,
  executionTestPass: false,
  recoveryTestPass: false,
  manualAdminApproval: null,
  liveModeEnabled: false,
};

function evaluateLiveGate(state) {
  const missing = [];
  if (!state.paperModePass) missing.push("paperModePass");
  if (!state.testnetPass) missing.push("testnetPass");
  if (!state.riskTestPass) missing.push("riskTestPass");
  if (!state.executionTestPass) missing.push("executionTestPass");
  if (!state.recoveryTestPass) missing.push("recoveryTestPass");
  if (state.manualAdminApproval !== true) missing.push("manualAdminApproval");
  if (!state.liveModeEnabled) missing.push("liveModeEnabled");
  if (missing.length) {
    return { allowed: false, reason: state.liveModeEnabled ? "PRECONDITION_OPEN" : "LIVE_MODE_OFF", missing };
  }
  return { allowed: true, reason: "GATE_OPEN", missing: [] };
}

async function execute(state, signer) {
  const gate = evaluateLiveGate(state);
  if (!gate.allowed) {
    return { submitted: false, signature: null, gate, signerRefused: false };
  }
  const signed = await signer.sign();
  return { submitted: false, signature: signed.signature, gate, signerRefused: signed.refused };
}

const closed = evaluateLiveGate(CLOSED);
assert.equal(closed.allowed, false);
assert.ok(closed.missing.includes("manualAdminApproval"));
assert.ok(closed.missing.includes("liveModeEnabled"));

const almost = evaluateLiveGate({
  paperModePass: true,
  testnetPass: true,
  riskTestPass: true,
  executionTestPass: true,
  recoveryTestPass: true,
  manualAdminApproval: true,
  liveModeEnabled: false,
});
assert.equal(almost.allowed, false);

const openFlags = {
  paperModePass: true,
  testnetPass: true,
  riskTestPass: true,
  executionTestPass: true,
  recoveryTestPass: true,
  manualAdminApproval: true,
  liveModeEnabled: true,
};
assert.equal(evaluateLiveGate(openFlags).allowed, true);

async function main() {
  const refused = await execute(CLOSED, {
    async sign() {
      return { signature: "should-not-run", refused: false };
    },
  });
  assert.equal(refused.submitted, false);
  assert.equal(refused.signature, null);
  assert.equal(refused.signerRefused, false);

  const gatedOpenButNoSigner = await execute(openFlags, {
    async sign() {
      return { signature: null, refused: true };
    },
  });
  assert.equal(gatedOpenButNoSigner.submitted, false);
  assert.equal(gatedOpenButNoSigner.signerRefused, true);

  console.log("Live engine gate-closed unit checks: PASS submitted=false flags_unread_from_env");
}

main();
