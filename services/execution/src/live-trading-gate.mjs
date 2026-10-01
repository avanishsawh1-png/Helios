export const CLOSED_SECTION_70 = {
  paperModePass: false,
  testnetPass: false,
  riskTestPass: false,
  executionTestPass: false,
  recoveryTestPass: false,
  manualAdminApproval: null,
  liveModeEnabled: false,
};

export function evaluateLiveGate(state = CLOSED_SECTION_70) {
  const missing = [];
  if (!state.paperModePass) missing.push("paperModePass");
  if (!state.testnetPass) missing.push("testnetPass");
  if (!state.riskTestPass) missing.push("riskTestPass");
  if (!state.executionTestPass) missing.push("executionTestPass");
  if (!state.recoveryTestPass) missing.push("recoveryTestPass");
  if (state.manualAdminApproval !== true) missing.push("manualAdminApproval");
  if (!state.liveModeEnabled) missing.push("liveModeEnabled");
  if (missing.length) {
    return {
      allowed: false,
      reason: !state.liveModeEnabled ? "LIVE_MODE_OFF" : state.manualAdminApproval !== true ? "APPROVAL_MISSING" : "PRECONDITION_OPEN",
      missing,
    };
  }
  return { allowed: true, reason: "GATE_OPEN", missing: [] };
}

export function loadSection70FromEnv() {
  return { ...CLOSED_SECTION_70 };
}
