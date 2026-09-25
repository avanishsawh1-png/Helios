/**
 * Wave O2 — Outbound Solana RPC rate-limit errors.
 * HTTP 429 and JSON-RPC -32005 (optional 503 overload).
 */

export class RpcRateLimitedError extends Error {
  readonly code = "RPC_RATE_LIMITED" as const;
  readonly retryAfterMs: number | null;
  readonly httpStatus: number | null;
  readonly rpcCode: number | null;

  constructor(opts: {
    message?: string;
    retryAfterMs?: number | null;
    httpStatus?: number | null;
    rpcCode?: number | null;
  } = {}) {
    super(opts.message ?? "RPC rate limited");
    this.name = "RpcRateLimitedError";
    this.retryAfterMs = opts.retryAfterMs ?? null;
    this.httpStatus = opts.httpStatus ?? null;
    this.rpcCode = opts.rpcCode ?? null;
  }
}

export class AllEndpointsUnavailableError extends Error {
  readonly code = "ALL_ENDPOINTS_UNAVAILABLE" as const;
  constructor(message = "All Solana RPC endpoints unavailable") {
    super(message);
    this.name = "AllEndpointsUnavailableError";
  }
}

export function parseRetryAfterMs(header: string | null | undefined, nowMs = Date.now()): number | null {
  if (!header) return null;
  const trimmed = header.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed) * 1000;
  }
  const when = Date.parse(trimmed);
  if (Number.isNaN(when)) return null;
  return Math.max(0, when - nowMs);
}

export function isRateLimitError(httpStatus: number | null, rpcCode: number | null): boolean {
  if (httpStatus === 429) return true;
  if (httpStatus === 503) return true;
  if (rpcCode === -32005) return true;
  return false;
}

export function isNonRetryableRpcCode(rpcCode: number | null): boolean {
  return rpcCode === -32600 || rpcCode === -32601 || rpcCode === -32602;
}
