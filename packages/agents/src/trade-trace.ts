/**
 * Wave 19 — On-demand trade-trace diagnostician.
 * Reconstructs a PAPER path from typed stage records. Missing stage ≠ success.
 */

import type { EvidenceRef } from "./diagnostician.js";

export type TraceStageName =
  | "discover"
  | "score"
  | "signal"
  | "risk"
  | "simulate"
  | "paper_fill"
  | "exit";

export interface TraceStage {
  name: TraceStageName;
  availability: "OK" | "EMPTY" | "UNAVAILABLE" | "STALE";
  at: string | null;
  note: string;
}

export interface TradeTrace {
  positionId: string;
  mode: "PAPER" | "LIVE" | "UNKNOWN";
  stages: TraceStage[];
  complete: boolean;
  evidence: EvidenceRef[];
  status: "TRACED" | "REJECTED_UNVERIFIED" | "INCONCLUSIVE" | "REFUSED_LIVE";
}

const ORDER: TraceStageName[] = [
  "discover",
  "score",
  "signal",
  "risk",
  "simulate",
  "paper_fill",
  "exit",
];

export function traceTrade(input: {
  positionId: string;
  mode: "PAPER" | "LIVE" | "UNKNOWN" | null;
  stages: Partial<Record<TraceStageName, TraceStage>>;
  evidence: EvidenceRef[];
}): TradeTrace {
  const mode = input.mode ?? "UNKNOWN";
  if (!input.evidence.length) {
    return {
      positionId: input.positionId,
      mode,
      stages: [],
      complete: false,
      evidence: [],
      status: "REJECTED_UNVERIFIED",
    };
  }
  if (mode === "LIVE") {
    return {
      positionId: input.positionId,
      mode,
      stages: [],
      complete: false,
      evidence: input.evidence,
      status: "REFUSED_LIVE",
    };
  }

  const stages: TraceStage[] = ORDER.map((name) => {
    const s = input.stages[name];
    return (
      s ?? {
        name,
        availability: "UNAVAILABLE",
        at: null,
        note: "not yet wired",
      }
    );
  });
  const complete = stages.every((s) => s.availability === "OK");
  return {
    positionId: input.positionId,
    mode: mode === "UNKNOWN" ? "UNKNOWN" : "PAPER",
    stages,
    complete,
    evidence: input.evidence,
    status: complete ? "TRACED" : "INCONCLUSIVE",
  };
}
