/**
 * Wave O2 — 429 backoff: honor Retry-After, else 1s → *2 → cap 30s, ±25% jitter, max 5.
 */

export interface BackoffConfig {
  initialMs: number;
  capMs: number;
  jitterRatio: number;
  maxAttempts: number;
}

export const DEFAULT_O2_BACKOFF: BackoffConfig = {
  initialMs: 1000,
  capMs: 30_000,
  jitterRatio: 0.25,
  maxAttempts: 5,
};

export function computeBackoffMs(
  attempt: number,
  retryAfterMs: number | null,
  cfg: BackoffConfig = DEFAULT_O2_BACKOFF,
  random: () => number = Math.random,
): number {
  if (retryAfterMs !== null && retryAfterMs >= 0) {
    return retryAfterMs;
  }
  const exp = Math.min(cfg.capMs, cfg.initialMs * 2 ** Math.max(0, attempt - 1));
  const jitter = exp * cfg.jitterRatio * (random() * 2 - 1);
  return Math.max(0, Math.round(exp + jitter));
}

export function canRetry(attempt: number, cfg: BackoffConfig = DEFAULT_O2_BACKOFF): boolean {
  return attempt < cfg.maxAttempts;
}
