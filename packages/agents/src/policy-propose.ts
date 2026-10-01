/**
 * Stage 4 §18 — rule-based reflection.
 * Produces an inactive candidate only. No LLM required. No activation.
 */

import type { PolicyEval } from "./policy-eval.js";
import type { ScoringWeights } from "./policy-versions.js";
import { weightsValid } from "./policy-versions.js";

export interface Proposal {
  fromVersion: string;
  toVersion: string;
  weights: ScoringWeights;
  reason: string;
  status: "PROPOSED_INACTIVE" | "REJECTED_UNVERIFIED" | "INSUFFICIENT_SAMPLE";
}

function nudge(w: ScoringWeights, key: keyof ScoringWeights, delta: number): ScoringWeights {
  const next = { ...w };
  next[key] = Math.max(0, next[key] + delta);
  const rest = (["security", "smartMoney", "momentum", "holder"] as const).filter((k) => k !== key);
  const restSum = rest.reduce((a, k) => a + next[k], 0);
  if (restSum <= 0) return w;
  const scale = (1 - next[key]) / restSum;
  for (const k of rest) next[k] *= scale;
  return next;
}

export function proposeFromEval(input: {
  eval: PolicyEval;
  current: ScoringWeights;
  failureCluster?: "thin_holders" | "weak_security" | "momentum_fade" | null;
}): Proposal {
  if (input.eval.availability !== "OK") {
    return {
      fromVersion: input.eval.policyVersion,
      toVersion: `${input.eval.policyVersion}:nudge`,
      weights: input.current,
      reason: "eval not OK",
      status: "INSUFFICIENT_SAMPLE",
    };
  }
  if (!input.failureCluster) {
    return {
      fromVersion: input.eval.policyVersion,
      toVersion: `${input.eval.policyVersion}:nudge`,
      weights: input.current,
      reason: "no cluster",
      status: "REJECTED_UNVERIFIED",
    };
  }
  const map = {
    thin_holders: "holder",
    weak_security: "security",
    momentum_fade: "momentum",
  } as const;
  const weights = nudge(input.current, map[input.failureCluster], 0.05);
  if (!weightsValid(weights)) {
    return {
      fromVersion: input.eval.policyVersion,
      toVersion: `${input.eval.policyVersion}:nudge`,
      weights: input.current,
      reason: "nudge invalid",
      status: "REJECTED_UNVERIFIED",
    };
  }
  return {
    fromVersion: input.eval.policyVersion,
    toVersion: `${input.eval.policyVersion}:nudge`,
    weights,
    reason: `nudge ${map[input.failureCluster]} +0.05 from cluster ${input.failureCluster}`,
    status: "PROPOSED_INACTIVE",
  };
}
