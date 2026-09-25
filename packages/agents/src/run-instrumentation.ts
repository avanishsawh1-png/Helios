/**
 * Stage 3 §14 — run identity on SCORE/SIGNAL events.
 * Snapshot is persisted as a record. No LIVE. No auto-promotion.
 */

export interface ScoringSnapshot {
  security: number | null;
  smartMoney: number | null;
  momentum: number | null;
  holder: number | null;
}

export interface ScoredRun {
  runId: string;
  policyVersion: string;
  snapshot: ScoringSnapshot;
  score: number | null;
  availability: "OK" | "EMPTY" | "UNAVAILABLE";
  event: "SCORE_CREATED" | "SIGNAL_CREATED";
  at: string;
}

export function newRunId(now = Date.now()): string {
  return `run_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function attachRunMeta(input: {
  policyVersion: string;
  snapshot: ScoringSnapshot;
  score: number | null;
  event: ScoredRun["event"];
  runId?: string;
  at?: string;
}): ScoredRun {
  const values = [input.snapshot.security, input.snapshot.smartMoney, input.snapshot.momentum, input.snapshot.holder];
  const availability = values.every((v) => v === null)
    ? "EMPTY"
    : input.score === null
      ? "UNAVAILABLE"
      : "OK";
  return {
    runId: input.runId ?? newRunId(),
    policyVersion: input.policyVersion,
    snapshot: input.snapshot,
    score: availability === "OK" ? input.score : null,
    availability,
    event: input.event,
    at: input.at ?? new Date().toISOString(),
  };
}

export class RunJournal {
  readonly rows: ScoredRun[] = [];

  record(run: ScoredRun): ScoredRun {
    this.rows.push(run);
    return run;
  }

  byRunId(runId: string): ScoredRun[] {
    return this.rows.filter((r) => r.runId === runId);
  }
}
