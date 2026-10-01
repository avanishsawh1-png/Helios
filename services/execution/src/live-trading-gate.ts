/**
 * Section 70 live-trading gate.
 * Closed by default. This module never writes flags.
 */

export interface Section70State {
  paperModePass: boolean;
  testnetPass: boolean;
  riskTestPass: boolean;
  executionTestPass: boolean;
  recoveryTestPass: boolean;
  manualAdminApproval: boolean | null;
  liveModeEnabled: boolean;
}

export const CLOSED_SECTION_70: Section70State = {
  paperModePass: false,
  testnetPass: false,
  riskTestPass: false,
  executionTestPass: false,
  recoveryTestPass: false,
  manualAdminApproval: null,
  liveModeEnabled: false,
};

export type LiveGateReason =
  | "GATE_OPEN"
  | "LIVE_MODE_OFF"
  | "APPROVAL_MISSING"
  | "PRECONDITION_OPEN";

export interface LiveGateResult {
  allowed: boolean;
  reason: LiveGateReason;
  missing: string[];
}

export function evaluateLiveGate(state: Section70State = CLOSED_SECTION_70): LiveGateResult {
  const missing: string[] = [];
  if (!state.paperModePass) missing.push("paperModePass");
  if (!state.testnetPass) missing.push("testnetPass");
  if (!state.riskTestPass) missing.push("riskTestPass");
  if (!state.executionTestPass) missing.push("executionTestPass");
  if (!state.recoveryTestPass) missing.push("recoveryTestPass");
  if (state.manualAdminApproval !== true) missing.push("manualAdminApproval");
  if (!state.liveModeEnabled) missing.push("liveModeEnabled");
  if (missing.length) {
    const reason: LiveGateReason =
      !state.liveModeEnabled
        ? "LIVE_MODE_OFF"
        : state.manualAdminApproval !== true
          ? "APPROVAL_MISSING"
          : "PRECONDITION_OPEN";
    return { allowed: false, reason, missing };
  }
  return { allowed: true, reason: "GATE_OPEN", missing: [] };
}

/** Default process state — env cannot silently turn LIVE on from this handoff. */
export function loadSection70FromEnv(env: NodeJS.ProcessEnv = process.env): Section70State {
  return {
    ...CLOSED_SECTION_70,
    // Intentionally ignore TRADING_MODE=LIVE here. Worker already refuses LIVE boot.
    liveModeEnabled: false,
    manualAdminApproval: null,
  };
}
