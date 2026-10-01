/**
 * Wave 8 — per-job / per-cycle stage outcome report.
 *
 * Every stage's outcome is recorded. `unavailable` short-circuits the token
 * (job), not the worker process.
 */

import type { PipelineStageName } from "./types.js";

export type StageOutcomeKind =
  | "CONTINUE"
  | "BLOCK"
  | "FAIL"
  | "UNAVAILABLE"
  | "THREW";

export interface StageOutcome {
  stage: PipelineStageName | string;
  kind: StageOutcomeKind;
  reason?: string;
  code?: string;
  durationMs: number;
}

export interface CycleReport {
  cycleId: string;
  jobId: string;
  correlationId: string;
  mint: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  /** Final job status mirror. */
  status: "COMPLETED" | "BLOCKED" | "FAILED";
  stages: StageOutcome[];
  riskAuthorized: boolean;
  paperExecuted: boolean;
  positionOpened: boolean;
  /** True if any stage reported UNAVAILABLE (e.g. RPC outage). */
  hadUnavailable: boolean;
}

export function createCycleReportId(now = () => new Date()): string {
  return `cycle_${now().toISOString().replace(/[:.]/g, "-")}_${Math.random().toString(36).slice(2, 8)}`;
}
