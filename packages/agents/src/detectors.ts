/**
 * Wave 15 — Tier 1 detectors / invariant monitor / alerting.
 * Observation only. Alerts never pause trading or set Section 70 flags.
 */

import type { ProbeResult } from "./probes.js";

export type AlertSeverity = "info" | "warn" | "danger";

export interface Alert {
  id: string;
  sourceProbe: string;
  severity: AlertSeverity;
  message: string;
  at: string;
}

export function alertsFromProbes(results: ProbeResult[], at = new Date().toISOString()): Alert[] {
  const out: Alert[] = [];
  for (const r of results) {
    if (r.status === "PASS") continue;
    out.push({
      id: `alert:${r.id}:${r.status}`,
      sourceProbe: r.id,
      severity: r.status === "FAIL" ? "danger" : "warn",
      message: r.detail,
      at,
    });
  }
  return out;
}

export class InvariantMonitor {
  readonly alerts: Alert[] = [];

  ingest(results: ProbeResult[], at?: string): Alert[] {
    const next = alertsFromProbes(results, at);
    this.alerts.push(...next);
    return next;
  }

  openDanger(): Alert[] {
    return this.alerts.filter((a) => a.severity === "danger");
  }
}
