/**
 * Wave 22 — Gateway commands, staging, loosening guards.
 * Safer (tighten) may stage immediately. Riskier (loosen) needs confirm token + delay.
 * Outside PAPER, delay is mandatory. Agents cannot confirm.
 */

import { HARD_LIMITS, validatePreset, type RiskPresetCandidate } from "./preset-validation.js";

export type Direction = "tighten" | "loosen" | "unchanged";

export function compareDirection(
  current: RiskPresetCandidate,
  next: RiskPresetCandidate,
): Direction {
  const looser =
    next.maxPositionUsd > current.maxPositionUsd ||
    next.maxExposurePct > current.maxExposurePct ||
    next.maxDailyLossUsd > current.maxDailyLossUsd ||
    next.stopLossPct < current.stopLossPct;
  const tighter =
    next.maxPositionUsd < current.maxPositionUsd ||
    next.maxExposurePct < current.maxExposurePct ||
    next.maxDailyLossUsd < current.maxDailyLossUsd ||
    next.stopLossPct > current.stopLossPct;
  if (looser && !tighter) return "loosen";
  if (tighter && !looser) return "tighten";
  if (!looser && !tighter) return "unchanged";
  return "loosen";
}

export interface StageRequest {
  actor: "human" | "agent";
  mode: "PAPER" | "LIVE";
  current: RiskPresetCandidate;
  next: RiskPresetCandidate;
  confirmToken?: string;
  killSwitchActive?: boolean;
}

export interface StageResult {
  status: "STAGED" | "APPLIED_TIGHTEN_PAPER" | "REJECTED";
  reason: string;
  delayMs: number;
}

export const LOOSEN_DELAY_MS = 3_600_000;

export function stagePresetChange(req: StageRequest): StageResult {
  if (req.actor !== "human") {
    return { status: "REJECTED", reason: "agent_cannot_stage", delayMs: 0 };
  }
  if (req.killSwitchActive) {
    return { status: "REJECTED", reason: "kill_switch_lock", delayMs: 0 };
  }
  const valid = validatePreset(req.next, HARD_LIMITS);
  if (valid.status !== "ACCEPTED_CANDIDATE") {
    return { status: "REJECTED", reason: valid.status, delayMs: 0 };
  }
  const dir = compareDirection(req.current, req.next);
  if (dir === "unchanged") {
    return { status: "REJECTED", reason: "unchanged", delayMs: 0 };
  }
  if (dir === "tighten") {
    return {
      status: req.mode === "PAPER" ? "APPLIED_TIGHTEN_PAPER" : "STAGED",
      reason: "tighten",
      delayMs: req.mode === "PAPER" ? 0 : LOOSEN_DELAY_MS,
    };
  }
  if (req.confirmToken !== "CONFIRM") {
    return { status: "REJECTED", reason: "confirm_token_required", delayMs: 0 };
  }
  if (req.mode !== "PAPER") {
    return { status: "STAGED", reason: "loosen_delayed", delayMs: LOOSEN_DELAY_MS };
  }
  return { status: "STAGED", reason: "loosen_paper_confirm", delayMs: 0 };
}
