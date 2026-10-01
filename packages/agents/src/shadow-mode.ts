/**
 * Wave 27 — Shadow mode.
 * Candidate decisions are recorded beside live PAPER decisions.
 * Shadow output never calls RiskPort.authorize or writes positions.
 */

import type { RiskDecision } from "./risk-observe.js";
import type { RiskPresetCandidate } from "./preset-validation.js";

export interface ShadowPair {
  intentSizeUsd: number | null;
  live: RiskDecision;
  shadow: RiskDecision;
  diverge: boolean;
}

export function shadowCompare(
  live: RiskDecision,
  shadow: RiskDecision,
  intentSizeUsd: number | null,
): ShadowPair {
  return {
    intentSizeUsd,
    live,
    shadow,
    diverge: live.allowed !== shadow.allowed || live.reason !== shadow.reason,
  };
}

export function applyShadow(_candidate: RiskPresetCandidate): never {
  throw new Error("shadow cannot write RiskPort / positions / orders");
}
