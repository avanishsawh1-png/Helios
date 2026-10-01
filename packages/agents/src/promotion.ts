/**
 * Wave 30 — Human-gated candidate promotion.
 * Promote only stored ACCEPTED_CANDIDATE rows. Agents cannot promote.
 * Promotion does not set Section 70 or TRADING_MODE=LIVE.
 */

import type { CandidateStore } from "./candidate-store.js";
import { stagePresetChange } from "./preset-staging.js";
import type { RiskPresetCandidate } from "./preset-validation.js";

export interface PromotionRequest {
  actor: "human" | "agent";
  mode: "PAPER" | "LIVE";
  candidateId: string;
  current: RiskPresetCandidate;
  confirmToken?: string;
  killSwitchActive?: boolean;
}

export function promoteCandidate(store: CandidateStore, req: PromotionRequest) {
  if (req.actor !== "human") {
    return { status: "REJECTED" as const, reason: "agent_cannot_promote" };
  }
  const row = store.get(req.candidateId);
  if (!row) return { status: "REJECTED" as const, reason: "not_found" };
  const staged = stagePresetChange({
    actor: req.actor,
    mode: req.mode,
    current: req.current,
    next: row.candidate,
    confirmToken: req.confirmToken,
    killSwitchActive: req.killSwitchActive,
  });
  return { status: staged.status, reason: staged.reason, delayMs: staged.delayMs };
}
