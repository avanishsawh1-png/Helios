/**
 * Wave 29 — Tier 3 maintenance planner / digest.
 * Tasks are advisory. Agents cannot mark done or run runbook steps.
 */

import type { Alert } from "./detectors.js";
import type { KnowledgeDoc } from "./knowledge-base.js";

export interface MaintTask {
  id: string;
  title: string;
  runbookId: string | null;
  status: "OPEN" | "DONE";
}

export function planFromAlerts(alerts: Alert[], runbooks: KnowledgeDoc[]): MaintTask[] {
  return alerts.map((a, i) => {
    const rb = runbooks.find((d) => d.kind === "runbook" && d.body.includes(a.sourceProbe)) ?? null;
    return {
      id: `task:${a.id}:${i}`,
      title: a.message,
      runbookId: rb?.id ?? null,
      status: "OPEN" as const,
    };
  });
}

export function markDone(_taskId: string, actor: "human" | "agent"): { ok: true } {
  if (actor !== "human") throw new Error("maintenance tasks are human-closed");
  return { ok: true };
}

export function executeRunbookStep(): never {
  throw new Error("agents cannot execute runbook steps");
}

export function dailyDigest(tasks: MaintTask[]): string {
  const open = tasks.filter((t) => t.status === "OPEN").length;
  return `maintenance digest: open=${open} total=${tasks.length}`;
}
