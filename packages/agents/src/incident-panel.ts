/**
 * Wave 16 — Three-tier incident read model.
 * Display only. Humans resolve incidents; agents do not mark done.
 */

import type { Alert } from "./detectors.js";
import type { AgentTier } from "./charter.js";

export interface Incident {
  id: string;
  tier: AgentTier;
  title: string;
  status: "OPEN" | "ACKED" | "RESOLVED";
  availability: "OK" | "EMPTY" | "UNAVAILABLE";
  alerts: Alert[];
}

export function tierForAlert(alert: Alert): AgentTier {
  if (alert.severity === "danger") return 2;
  if (alert.sourceProbe.startsWith("maint")) return 3;
  return 1;
}

export function incidentsFromAlerts(alerts: Alert[] | null | undefined): {
  availability: "OK" | "EMPTY" | "UNAVAILABLE";
  byTier: Record<AgentTier, Incident[]>;
} {
  if (alerts == null) {
    return { availability: "UNAVAILABLE", byTier: { 1: [], 2: [], 3: [] } };
  }
  if (alerts.length === 0) {
    return { availability: "EMPTY", byTier: { 1: [], 2: [], 3: [] } };
  }
  const byTier: Record<AgentTier, Incident[]> = { 1: [], 2: [], 3: [] };
  for (const alert of alerts) {
    const tier = tierForAlert(alert);
    byTier[tier].push({
      id: `inc:${alert.id}`,
      tier,
      title: alert.message,
      status: "OPEN",
      availability: "OK",
      alerts: [alert],
    });
  }
  return { availability: "OK", byTier };
}

export function humanResolve(_incidentId: string, actor: "human" | "agent"): never | { ok: true } {
  if (actor !== "human") {
    throw new Error("incidents are human-resolved only");
  }
  return { ok: true };
}
