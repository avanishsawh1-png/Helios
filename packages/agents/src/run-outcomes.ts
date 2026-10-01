/**
 * Stage 3 §15 — link Exit to originating run_id.
 * Null PnL stays null. No LIVE writes.
 */

export type PnlAvailability = "OK" | "EMPTY" | "UNAVAILABLE" | "INSUFFICIENT_SAMPLE";

export interface AgentRunOutcome {
  runId: string;
  policyVersion: string;
  realizedPnlPct: number | null;
  pnlAvailability: PnlAvailability;
  exitReason: string | null;
  timeInPositionMs: number | null;
}

export function outcomeFromExit(input: {
  runId: string | null;
  policyVersion: string;
  realizedPnlPct: number | null;
  exitReason: string | null;
  timeInPositionMs: number | null;
  markOk: boolean;
}): AgentRunOutcome | { rejected: true; reason: string } {
  if (!input.runId) return { rejected: true, reason: "missing_run_id" };
  let pnlAvailability: PnlAvailability = "OK";
  let realized = input.realizedPnlPct;
  if (!input.markOk) {
    pnlAvailability = "UNAVAILABLE";
    realized = null;
  } else if (realized === null) {
    pnlAvailability = "EMPTY";
  }
  return {
    runId: input.runId,
    policyVersion: input.policyVersion,
    realizedPnlPct: realized,
    pnlAvailability,
    exitReason: input.exitReason,
    timeInPositionMs: input.timeInPositionMs,
  };
}

export class OutcomeStore {
  private readonly rows = new Map<string, AgentRunOutcome>();

  put(row: AgentRunOutcome): void {
    this.rows.set(row.runId, row);
  }

  get(runId: string): AgentRunOutcome | null {
    return this.rows.get(runId) ?? null;
  }

  byPolicy(policyVersion: string): AgentRunOutcome[] {
    return [...this.rows.values()].filter((r) => r.policyVersion === policyVersion);
  }
}
