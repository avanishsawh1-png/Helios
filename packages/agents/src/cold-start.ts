/**
 * Wave 28 — Cold-start cohorts + untrusted input.
 * Low-history tokens are their own cohort. Dead tokens (no later price) are separate.
 * Token text is sanitized and never placed raw in a system prompt.
 */

import { sanitizeUntrusted } from "./knowledge-base.js";

export type TokenCohort = "established" | "cold_start" | "dead_no_later_price";

export interface TokenSample {
  mint: string;
  symbol: string;
  historyN: number;
  laterPrice: number | null;
}

export const COLD_START_MAX_N = 5;

export function classifyToken(sample: TokenSample): TokenCohort {
  if (sample.laterPrice === null) return "dead_no_later_price";
  if (sample.historyN < COLD_START_MAX_N) return "cold_start";
  return "established";
}

export function headlineSet(samples: TokenSample[]): TokenSample[] {
  return samples.filter((s) => classifyToken(s) === "established");
}

export function systemPromptSafeSymbol(symbol: string): string {
  return sanitizeUntrusted(symbol, 32);
}

export function cohortCounts(samples: TokenSample[]): Record<TokenCohort, number> {
  const out: Record<TokenCohort, number> = {
    established: 0,
    cold_start: 0,
    dead_no_later_price: 0,
  };
  for (const s of samples) out[classifyToken(s)] += 1;
  return out;
}
