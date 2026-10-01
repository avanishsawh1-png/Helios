/**
 * Wave 25 — Replay harness.
 * Time-based splits only. No random / k-fold. No live decision writes.
 */

export interface TimedRow {
  at: string;
  value: number | null;
}

export interface ReplaySplit {
  train: TimedRow[];
  validate: TimedRow[];
}

export class ReplayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReplayError";
  }
}

export function timeSplit(rows: TimedRow[], cutoffIso: string): ReplaySplit {
  const cutoff = Date.parse(cutoffIso);
  if (Number.isNaN(cutoff)) throw new ReplayError("invalid cutoff");
  const ordered = [...rows].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  return {
    train: ordered.filter((r) => Date.parse(r.at) < cutoff),
    validate: ordered.filter((r) => Date.parse(r.at) >= cutoff),
  };
}

export function kFoldSplit(_rows: TimedRow[], _k: number): never {
  throw new ReplayError("k-fold / random splits are forbidden (G17)");
}

export function randomSplit(_rows: TimedRow[]): never {
  throw new ReplayError("random splits are forbidden (G17)");
}
