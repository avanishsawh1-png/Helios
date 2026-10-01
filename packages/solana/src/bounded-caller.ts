/**
 * Wave O2 — fail-closed multi-endpoint caller with budget + 429 policy.
 * Never invents chain data.
 */

import {
  AllEndpointsUnavailableError,
  RpcRateLimitedError,
  isNonRetryableRpcCode,
  isRateLimitError,
  parseRetryAfterMs,
} from "./rpc-errors.js";
import { canRetry, computeBackoffMs, DEFAULT_O2_BACKOFF } from "./rpc-backoff.js";
import { OutboundRpcBudget } from "./outbound-budget.js";

export interface RpcCallResult {
  ok: boolean;
  httpStatus: number | null;
  rpcCode: number | null;
  retryAfterHeader?: string | null;
  body?: unknown;
}

export interface RpcEndpointPort {
  name: string;
  call(method: string, params: unknown[]): Promise<RpcCallResult>;
}

export interface SolanaCallerMetrics {
  rateLimited: number;
  budgetWaits: number;
  failClosed: number;
}

export class BoundedSolanaCaller {
  readonly metrics: SolanaCallerMetrics = { rateLimited: 0, budgetWaits: 0, failClosed: 0 };

  constructor(
    private readonly endpoints: RpcEndpointPort[],
    private readonly budget: OutboundRpcBudget,
    private readonly sleep: (ms: number) => Promise<void> = (ms) =>
      new Promise((r) => setTimeout(r, ms)),
  ) {}

  async call(method: string, params: unknown[] = []): Promise<unknown> {
    if (this.endpoints.length === 0) {
      this.metrics.failClosed += 1;
      throw new AllEndpointsUnavailableError();
    }

    let lastRateLimit: RpcRateLimitedError | null = null;
    const errors: string[] = [];

    for (const ep of this.endpoints) {
      for (let attempt = 1; attempt <= DEFAULT_O2_BACKOFF.maxAttempts; attempt += 1) {
        if (!this.budget.tryTake()) {
          this.metrics.budgetWaits += 1;
          await this.sleep(50);
          if (!this.budget.tryTake()) {
            errors.push(`${ep.name}:budget`);
            break;
          }
        }
        try {
          const res = await ep.call(method, params);
          if (res.ok) return res.body;
          if (isNonRetryableRpcCode(res.rpcCode)) {
            errors.push(`${ep.name}:nonretryable:${res.rpcCode}`);
            break;
          }
          if (isRateLimitError(res.httpStatus, res.rpcCode)) {
            this.metrics.rateLimited += 1;
            const retryAfterMs = parseRetryAfterMs(res.retryAfterHeader ?? null);
            lastRateLimit = new RpcRateLimitedError({
              httpStatus: res.httpStatus,
              rpcCode: res.rpcCode,
              retryAfterMs,
            });
            if (!canRetry(attempt)) break;
            await this.sleep(computeBackoffMs(attempt, retryAfterMs));
            continue;
          }
          errors.push(`${ep.name}:status:${res.httpStatus}:${res.rpcCode}`);
          break;
        } finally {
          this.budget.release();
        }
      }
    }

    this.metrics.failClosed += 1;
    throw lastRateLimit ?? new AllEndpointsUnavailableError(errors.join("; ") || "exhausted");
  }
}
