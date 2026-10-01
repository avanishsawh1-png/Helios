/**
 * Wave 31 — Cross-system consistency.
 * Agent OS views must agree with trading fail-closed facts.
 */

import { PROTECTED_TARGETS, isProtectedTarget } from "./charter.js";
import { HARD_LIMITS, validatePreset, type RiskPresetCandidate } from "./preset-validation.js";

export interface ConsistencyFinding {
  id: string;
  ok: boolean;
  detail: string;
}

export function checkProtectedListExtended(extra: string[]): ConsistencyFinding {
  const missing = extra.filter((x) => !isProtectedTarget(x) && !(PROTECTED_TARGETS as readonly string[]).includes(x));
  return {
    id: "protected-extended-not-forked",
    ok: extra.every((x) => isProtectedTarget(x) || (PROTECTED_TARGETS as readonly string[]).includes(x)),
    detail: missing.length ? missing.join(",") : "ok",
  };
}

export function checkCandidateUnderHard(candidate: RiskPresetCandidate): ConsistencyFinding {
  const v = validatePreset(candidate, HARD_LIMITS);
  return {
    id: "candidate-under-hard",
    ok: v.status === "ACCEPTED_CANDIDATE",
    detail: v.status,
  };
}

export function checkEmptyVsUnavailable(panelAvailability: string, alertFeedIsNull: boolean): ConsistencyFinding {
  const expected = alertFeedIsNull ? "UNAVAILABLE" : panelAvailability === "EMPTY" ? "EMPTY" : panelAvailability;
  const ok = alertFeedIsNull ? panelAvailability === "UNAVAILABLE" : panelAvailability !== "UNAVAILABLE" || alertFeedIsNull;
  return {
    id: "empty-vs-unavailable",
    ok: alertFeedIsNull ? panelAvailability === "UNAVAILABLE" : true,
    detail: expected,
  };
}

export function consistencySuite(input: {
  extraProtected: string[];
  candidate: RiskPresetCandidate;
  panelAvailability: string;
  alertFeedIsNull: boolean;
}): ConsistencyFinding[] {
  return [
    checkProtectedListExtended(input.extraProtected),
    checkCandidateUnderHard(input.candidate),
    checkEmptyVsUnavailable(input.panelAvailability, input.alertFeedIsNull),
  ];
}
