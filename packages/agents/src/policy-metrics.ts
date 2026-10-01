/**
 * Stage 4 §21 — per-policy health metrics (read-only).
 * Does not change ProductionGate.verified or Section 70.
 */

import type { PolicyEval } from "./policy-eval.js";

export interface PolicyMetricLine {
  name: string;
  value: number | null;
  availability: PolicyEval["availability"] | "EMPTY";
}

export function policyMetrics(evals: PolicyEval[]): PolicyMetricLine[] {
  if (!evals.length) return [{ name: "policy.eval.count", value: null, availability: "EMPTY" }];
  const lines: PolicyMetricLine[] = [
    { name: "policy.eval.count", value: evals.length, availability: "OK" },
  ];
  for (const e of evals) {
    const prefix = `policy.${e.policyVersion}`;
    lines.push(
      { name: `${prefix}.n_pnl_ok`, value: e.nPnlOk, availability: e.availability },
      { name: `${prefix}.win_rate`, value: e.winRate, availability: e.availability },
      { name: `${prefix}.avg_pnl_pct`, value: e.avgPnlPct, availability: e.availability },
      { name: `${prefix}.false_positive_rate`, value: e.falsePositiveRate, availability: e.availability },
      { name: `${prefix}.max_drawdown_pct`, value: e.maxDrawdownPct, availability: e.availability },
    );
  }
  return lines;
}
