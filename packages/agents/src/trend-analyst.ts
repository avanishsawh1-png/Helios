/**
 * Wave 17 — Tier 1 trend analyst (observation only).
 * Tools compute the series; the model only narrates typed stats.
 */

import type { FeatureEvent } from "./feature-capture.js";

export interface TrendStats {
  name: string;
  n: number;
  first: number | null;
  last: number | null;
  delta: number | null;
  availability: "OK" | "EMPTY" | "UNAVAILABLE" | "INSUFFICIENT_SAMPLE";
}

export const TREND_MIN_N = 3;

export function computeTrend(events: FeatureEvent[], name: string): TrendStats {
  const rows = events.filter((e) => e.name === name && e.availability === "OK" && typeof e.value === "number");
  if (events.length === 0) {
    return { name, n: 0, first: null, last: null, delta: null, availability: "UNAVAILABLE" };
  }
  if (rows.length === 0) {
    return { name, n: 0, first: null, last: null, delta: null, availability: "EMPTY" };
  }
  if (rows.length < TREND_MIN_N) {
    return {
      name,
      n: rows.length,
      first: rows[0].value as number,
      last: rows[rows.length - 1].value as number,
      delta: null,
      availability: "INSUFFICIENT_SAMPLE",
    };
  }
  const first = rows[0].value as number;
  const last = rows[rows.length - 1].value as number;
  return { name, n: rows.length, first, last, delta: last - first, availability: "OK" };
}

export function narrateTrend(stats: TrendStats): string {
  if (stats.availability !== "OK" || stats.delta === null) {
    return `trend ${stats.name}: ${stats.availability} (n=${stats.n})`;
  }
  const dir = stats.delta > 0 ? "up" : stats.delta < 0 ? "down" : "flat";
  return `trend ${stats.name}: ${dir} delta=${stats.delta} n=${stats.n}`;
}
