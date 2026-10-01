/**
 * Stage 4 §20 — scoring policy promotion gate.
 * Same window, both evals OK, candidate must beat current. Human only.
 */

import type { PolicyEval } from "./policy-eval.js";
import { PolicyVersionStore, type PolicyVersionRow } from "./policy-versions.js";

export interface PromotionDecision {
  status: "PROMOTED" | "REJECTED" | "INSUFFICIENT_SAMPLE";
  reason: string;
}

export function decidePromotion(input: {
  actor: "human" | "agent";
  current: PolicyEval;
  candidate: PolicyEval;
}): PromotionDecision {
  if (input.actor !== "human") return { status: "REJECTED", reason: "agent_cannot_promote" };
  if (input.current.availability !== "OK" || input.candidate.availability !== "OK") {
    return { status: "INSUFFICIENT_SAMPLE", reason: "eval_not_ok" };
  }
  if (input.current.nPnlOk !== input.candidate.nPnlOk) {
    return { status: "REJECTED", reason: "window_mismatch" };
  }
  const cur = input.current.avgPnlPct ?? Number.NEGATIVE_INFINITY;
  const cand = input.candidate.avgPnlPct ?? Number.NEGATIVE_INFINITY;
  if (!(cand > cur)) return { status: "REJECTED", reason: "no_edge" };
  return { status: "PROMOTED", reason: "candidate_avg_pnl_higher" };
}

export function applyPromotion(
  store: PolicyVersionStore,
  candidate: PolicyVersionRow,
  decision: PromotionDecision,
): PolicyVersionRow | never {
  if (decision.status !== "PROMOTED") throw new Error(decision.reason);
  return store.insert({ ...candidate, active: true, createdBy: "human" });
}
