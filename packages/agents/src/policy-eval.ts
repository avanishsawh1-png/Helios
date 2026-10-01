/**
 * Stage 3 §16 — evaluation per policy_version.
 * Tools compute. Missing PnL excluded from averages, counted in sample gaps.
 */

import type { AgentRunOutcome } from "./run-outcomes.js";

export const EVAL_MIN_N = 20;

export interface PolicyEval {
  policyVersion: string;
  nTotal: number;
  nPnlOk: number;
  nWins: number;
  winRate: number | null;
  avgPnlPct: number | null;
  falsePositiveRate: number | null;
  maxDrawdownPct: number | null;
  availability: "OK" | "INSUFFICIENT_SAMPLE";
}

export function evaluatePolicy(policyVersion: string, rows: AgentRunOutcome[]): PolicyEval {
  const mine = rows.filter((r) => r.policyVersion === policyVersion);
  const ok = mine.filter((r) => r.pnlAvailability === "OK" && r.realizedPnlPct !== null);
  const wins = ok.filter((r) => (r.realizedPnlPct as number) > 0);
  const fps = ok.filter((r) => (r.realizedPnlPct as number) < 0);
  const avg =
    ok.length === 0 ? null : ok.reduce((a, r) => a + (r.realizedPnlPct as number), 0) / ok.length;

  let peak = 0;
  let equity = 0;
  let maxDd: number | null = ok.length ? 0 : null;
  for (const r of ok) {
    equity += r.realizedPnlPct as number;
    if (equity > peak) peak = equity;
    const dd = peak - equity;
    if (maxDd !== null && dd > maxDd) maxDd = dd;
  }

  const ready = ok.length >= EVAL_MIN_N;
  return {
    policyVersion,
    nTotal: mine.length,
    nPnlOk: ok.length,
    nWins: wins.length,
    winRate: ok.length ? wins.length / ok.length : null,
    avgPnlPct: avg,
    falsePositiveRate: ok.length ? fps.length / ok.length : null,
    maxDrawdownPct: maxDd,
    availability: ready ? "OK" : "INSUFFICIENT_SAMPLE",
  };
}
