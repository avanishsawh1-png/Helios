/**
 * Wave 18 — Tier 2 baseline & incident diagnostician.
 * Evidence required. Unverifiable → REJECTED_UNVERIFIED. Advisory only.
 */

import type { Incident } from "./incident-panel.js";
import type { TrendStats } from "./trend-analyst.js";

export interface EvidenceRef {
  toolCallId: string;
  source: string;
}

export type DiagnosisStatus = "DIAGNOSED" | "REJECTED_UNVERIFIED" | "INCONCLUSIVE";

export interface Diagnosis {
  incidentId: string;
  status: DiagnosisStatus;
  summary: string;
  evidence: EvidenceRef[];
}

export function diagnoseIncident(input: {
  incident: Incident;
  baseline: TrendStats | null;
  evidence: EvidenceRef[];
}): Diagnosis {
  if (!input.evidence.length) {
    return {
      incidentId: input.incident.id,
      status: "REJECTED_UNVERIFIED",
      summary: "no EvidenceRef",
      evidence: [],
    };
  }
  if (!input.baseline || input.baseline.availability !== "OK") {
    return {
      incidentId: input.incident.id,
      status: "INCONCLUSIVE",
      summary: `baseline ${input.baseline?.availability ?? "missing"}`,
      evidence: input.evidence,
    };
  }
  return {
    incidentId: input.incident.id,
    status: "DIAGNOSED",
    summary: `${input.incident.title} vs baseline delta=${input.baseline.delta} n=${input.baseline.n}`,
    evidence: input.evidence,
  };
}
