/**
 * Wave E1 — Exit baseline metrics (observation only).
 *
 * This module records what the existing deterministic ExitEngine would
 * already decide. It MUST NOT change evaluate() outcomes, trail parameters,
 * or call recordExit. No LLM. PAPER telemetry only.
 */

export type ExitReason =
  | "STOP_LOSS"
  | "TAKE_PROFIT"
  | "TRAIL"
  | "TIME_STOP"
  | "MANUAL_EXIT"
  | "KILL_SWITCH"
  | "NONE";

export type MarkStatus = "OK" | "STALE" | "UNKNOWN" | "UNAVAILABLE";

export interface ExitObservation {
  positionId: string;
  mint: string;
  mode: "PAPER" | "LIVE";
  reason: ExitReason;
  wouldExit: boolean;
  entryPrice: number | null;
  markPrice: number | null;
  markStatus: MarkStatus;
  unrealizedPnlPct: number | null;
  holdMs: number | null;
  observedAt: string;
  sampleWindowId: string;
}

export interface BaselineCohort {
  label: string;
  n: number;
  windowStart: string | null;
  windowEnd: string | null;
  wouldExitCount: number;
  reasonCounts: Record<ExitReason, number>;
  unpricedCount: number;
  nullPnlCount: number;
  /** Honest: never treat missing marks as 0 PnL. */
  medianUnrealizedPnlPct: number | null;
  insufficientSample: boolean;
}

export const E1_MIN_SAMPLE = 30;

export function emptyReasonCounts(): Record<ExitReason, number> {
  return {
    STOP_LOSS: 0,
    TAKE_PROFIT: 0,
    TRAIL: 0,
    TIME_STOP: 0,
    MANUAL_EXIT: 0,
    KILL_SWITCH: 0,
    NONE: 0,
  };
}

export function formatUnknown(value: number | null): string {
  return value === null || Number.isNaN(value) ? "—" : String(value);
}

export function computeUnrealizedPnlPct(
  entryPrice: number | null,
  markPrice: number | null,
  markStatus: MarkStatus,
): number | null {
  if (markStatus !== "OK") return null;
  if (entryPrice === null || markPrice === null) return null;
  if (!(entryPrice > 0) || !(markPrice > 0)) return null;
  return ((markPrice - entryPrice) / entryPrice) * 100;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export class ExitBaselineCollector {
  private readonly observations: ExitObservation[] = [];

  constructor(private readonly sampleWindowId: string) {}

  record(input: Omit<ExitObservation, "sampleWindowId">): ExitObservation {
    const row: ExitObservation = {
      ...input,
      sampleWindowId: this.sampleWindowId,
      unrealizedPnlPct: computeUnrealizedPnlPct(
        input.entryPrice,
        input.markPrice,
        input.markStatus,
      ),
    };
    this.observations.push(row);
    return row;
  }

  snapshot(label = "all"): BaselineCohort {
    const rows = this.observations;
    const reasonCounts = emptyReasonCounts();
    const pnls: number[] = [];
    let unpriced = 0;
    let nullPnl = 0;
    let wouldExitCount = 0;
    let windowStart: string | null = null;
    let windowEnd: string | null = null;

    for (const row of rows) {
      reasonCounts[row.reason] += 1;
      if (row.wouldExit) wouldExitCount += 1;
      if (row.markStatus !== "OK" || row.markPrice === null) unpriced += 1;
      if (row.unrealizedPnlPct === null) nullPnl += 1;
      else pnls.push(row.unrealizedPnlPct);
      if (!windowStart || row.observedAt < windowStart) windowStart = row.observedAt;
      if (!windowEnd || row.observedAt > windowEnd) windowEnd = row.observedAt;
    }

    return {
      label,
      n: rows.length,
      windowStart,
      windowEnd,
      wouldExitCount,
      reasonCounts,
      unpricedCount: unpriced,
      nullPnlCount: nullPnl,
      medianUnrealizedPnlPct: median(pnls),
      insufficientSample: rows.length < E1_MIN_SAMPLE,
    };
  }

  all(): readonly ExitObservation[] {
    return this.observations;
  }
}
