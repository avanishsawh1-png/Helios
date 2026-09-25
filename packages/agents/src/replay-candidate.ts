/**
 * Wave 26 — Candidate configs from replay.
 * Derived from validate-split stats. Still must pass hard-limit validation.
 * Never auto-applied.
 */

import { validatePreset, type RiskPresetCandidate } from "./preset-validation.js";
import type { ReplaySplit } from "./replay.js";

export function meanNumeric(rows: { value: number | null }[]): number | null {
  const xs = rows.map((r) => r.value).filter((v): v is number => v !== null);
  if (!xs.length) return null;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function candidateFromReplay(
  base: RiskPresetCandidate,
  split: ReplaySplit,
): { candidate: RiskPresetCandidate; status: string; reason: string } {
  const vol = meanNumeric(split.validate);
  if (vol === null) {
    return { candidate: base, status: "INSUFFICIENT_SAMPLE", reason: "validate empty/null" };
  }
  const next: RiskPresetCandidate = {
    ...base,
    id: `${base.id}:replay`,
    maxPositionUsd: Math.min(base.maxPositionUsd, Math.max(1, Math.floor(base.maxPositionUsd * 0.9))),
  };
  const check = validatePreset(next);
  if (check.status !== "ACCEPTED_CANDIDATE") {
    return { candidate: next, status: check.status, reason: check.reasons.join(",") };
  }
  return { candidate: next, status: "CANDIDATE", reason: "tightened_from_replay" };
}
