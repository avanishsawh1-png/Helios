/**
 * Wave 20 — Validation core for adjustable risk presets.
 * Hard limits are immutable. Candidates that exceed them are rejected.
 * Nothing here applies a preset.
 */

export interface HardRiskLimits {
  maxPositionUsd: number;
  maxExposurePct: number;
  maxDailyLossUsd: number;
  minStopLossPct: number;
}

export const HARD_LIMITS: HardRiskLimits = {
  maxPositionUsd: 250,
  maxExposurePct: 25,
  maxDailyLossUsd: 100,
  minStopLossPct: 5,
};

export interface RiskPresetCandidate {
  id: string;
  maxPositionUsd: number;
  maxExposurePct: number;
  maxDailyLossUsd: number;
  stopLossPct: number;
}

export type ValidationStatus = "ACCEPTED_CANDIDATE" | "REJECTED_EXCEEDS_HARD" | "REJECTED_INVALID";

export interface ValidationResult {
  status: ValidationStatus;
  reasons: string[];
}

export function validatePreset(
  candidate: RiskPresetCandidate,
  hard: HardRiskLimits = HARD_LIMITS,
): ValidationResult {
  const reasons: string[] = [];
  if (!(candidate.maxPositionUsd > 0) || !(candidate.maxExposurePct > 0) || !(candidate.stopLossPct > 0)) {
    return { status: "REJECTED_INVALID", reasons: ["non_positive_field"] };
  }
  if (candidate.maxPositionUsd > hard.maxPositionUsd) reasons.push("maxPositionUsd");
  if (candidate.maxExposurePct > hard.maxExposurePct) reasons.push("maxExposurePct");
  if (candidate.maxDailyLossUsd > hard.maxDailyLossUsd) reasons.push("maxDailyLossUsd");
  if (candidate.stopLossPct < hard.minStopLossPct) reasons.push("stopLossPct_looser_than_hard");
  if (reasons.length) return { status: "REJECTED_EXCEEDS_HARD", reasons };
  return { status: "ACCEPTED_CANDIDATE", reasons: [] };
}

export function applyPreset(_candidate: RiskPresetCandidate): never {
  throw new Error("preset apply is human-gated — Wave 22+");
}
