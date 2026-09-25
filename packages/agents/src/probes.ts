/**
 * Wave 11 — Deterministic probes / invariants.
 * Missing data → not green. No trading writes. No LLM.
 */

import type { FeatureEvent } from "./feature-capture.js";

export type ProbeStatus = "PASS" | "FAIL" | "INCONCLUSIVE";

export interface ProbeResult {
  id: string;
  status: ProbeStatus;
  detail: string;
  evidence: FeatureEvent | null;
}

export function probeNullNeverZero(events: FeatureEvent[]): ProbeResult {
  const bad = events.find((e) => e.availability !== "OK" && e.value === 0);
  if (events.length === 0) {
    return {
      id: "null-never-zero",
      status: "INCONCLUSIVE",
      detail: "no events",
      evidence: null,
    };
  }
  if (bad) {
    return {
      id: "null-never-zero",
      status: "FAIL",
      detail: `${bad.name} stored 0 under ${bad.availability}`,
      evidence: bad,
    };
  }
  return {
    id: "null-never-zero",
    status: "PASS",
    detail: "non-OK events are null",
    evidence: events[events.length - 1],
  };
}

export function probePaperMode(mode: string | null | undefined): ProbeResult {
  if (mode == null || mode === "") {
    return {
      id: "paper-mode",
      status: "INCONCLUSIVE",
      detail: "TRADING_MODE unknown",
      evidence: null,
    };
  }
  const n = mode.toUpperCase();
  if (n === "LIVE") {
    return {
      id: "paper-mode",
      status: "FAIL",
      detail: "LIVE not allowed on agent observation path",
      evidence: null,
    };
  }
  return {
    id: "paper-mode",
    status: "PASS",
    detail: `mode=${n}`,
    evidence: null,
  };
}

export function probeProtectedUntouched(writes: string[], protectedNames: string[]): ProbeResult {
  const hit = writes.find((w) => protectedNames.some((p) => w === p || w.startsWith(`${p}.`)));
  if (hit) {
    return {
      id: "protected-untouched",
      status: "FAIL",
      detail: `write attempted: ${hit}`,
      evidence: null,
    };
  }
  return {
    id: "protected-untouched",
    status: "PASS",
    detail: "no protected writes",
    evidence: null,
  };
}

export function runInvariantSuite(input: {
  events: FeatureEvent[];
  mode: string | null;
  writes: string[];
  protectedNames: string[];
}): ProbeResult[] {
  return [
    probeNullNeverZero(input.events),
    probePaperMode(input.mode),
    probeProtectedUntouched(input.writes, input.protectedNames),
  ];
}

export function suiteGreen(results: ProbeResult[]): boolean {
  if (results.some((r) => r.status === "FAIL")) return false;
  if (results.some((r) => r.status === "INCONCLUSIVE")) return false;
  return results.every((r) => r.status === "PASS");
}
