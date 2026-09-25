/**
 * Stage 4 §19 — shadow scoring policy.
 * Candidate score is logged. Live score/signal path is unchanged.
 */

import type { ScoringSnapshot } from "./run-instrumentation.js";
import type { ScoringWeights } from "./policy-versions.js";

export function applyWeights(snapshot: ScoringSnapshot, weights: ScoringWeights): number | null {
  const parts: Array<[number | null, number]> = [
    [snapshot.security, weights.security],
    [snapshot.smartMoney, weights.smartMoney],
    [snapshot.momentum, weights.momentum],
    [snapshot.holder, weights.holder],
  ];
  if (parts.some(([v]) => v === null)) return null;
  return parts.reduce((a, [v, w]) => a + (v as number) * w, 0);
}

export interface ShadowScore {
  runId: string;
  liveScore: number | null;
  shadowScore: number | null;
  diverge: boolean;
}

export function shadowScore(input: {
  runId: string;
  snapshot: ScoringSnapshot;
  liveWeights: ScoringWeights;
  candidateWeights: ScoringWeights;
}): ShadowScore {
  const liveScore = applyWeights(input.snapshot, input.liveWeights);
  const shadow = applyWeights(input.snapshot, input.candidateWeights);
  return {
    runId: input.runId,
    liveScore,
    shadowScore: shadow,
    diverge: liveScore !== shadow,
  };
}

export function emitShadowSignal(): never {
  throw new Error("shadow scoring cannot emit SIGNAL_CREATED or touch risk/paper");
}
