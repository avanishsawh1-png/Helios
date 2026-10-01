/**
 * Wave 7 — live Solana `simulateTransaction` client.
 *
 * Config (do not set sigVerify:true with replaceRecentBlockhash:true):
 *   {
 *     encoding: "base64",
 *     sigVerify: false,
 *     replaceRecentBlockhash: true,
 *     commitment: "confirmed"
 *   }
 *
 * Outcome taxonomy:
 *   value.err === null     → rpcSuccess true (one input, not the verdict)
 *   value.err === {...}    → simulation failed result (not an outage)
 *   JSON-RPC -32002/-32003/-32015/-32602 → result with err (ok response)
 *   HTTP 5xx / 429 / network / -32004 / -32005 → unavailable (throw)
 *   unitsConsumed missing  → computeUnitsConsumed = Number.MAX_SAFE_INTEGER
 *                            so COMPUTE check cannot pass as if 0 were fine
 *
 * `passed` remains the AND of five checks in TransactionSimulator — never
 * a pass-through of rpcSuccess alone.
 */

import type { RpcSimulateClient, RpcSimulateResponse } from "./upstream.js";

export const SIMULATE_CONFIG = {
  encoding: "base64" as const,
  sigVerify: false as const,
  replaceRecentBlockhash: true as const,
  commitment: "confirmed" as const,
};

/** JSON-RPC codes treated as simulation *results* (not transport outages). */
const RESULT_RPC_CODES = new Set([-32002, -32003, -32015, -32602]);

/** JSON-RPC codes treated as unavailable (slot/blockhash infra issues). */
const UNAVAILABLE_RPC_CODES = new Set([-32004, -32005]);

export class SimulateUnavailableError extends Error {
  readonly code = "SIMULATE_UNAVAILABLE" as const;
  readonly httpStatus: number | null;
  readonly rpcCode: number | null;
  readonly retryAfterMs: number | null;

  constructor(
    message: string,
    opts: {
      httpStatus?: number | null;
      rpcCode?: number | null;
      retryAfterMs?: number | null;
    } = {},
  ) {
    super(message);
    this.name = "SimulateUnavailableError";
    this.httpStatus = opts.httpStatus ?? null;
    this.rpcCode = opts.rpcCode ?? null;
    this.retryAfterMs = opts.retryAfterMs ?? null;
  }
}

export interface LiveSolanaSimulateClientOptions {
  rpcUrl: string;
  fetchImpl?: typeof fetch;
  log?: (msg: string, fields?: Record<string, unknown>) => void;
}

/**
 * Low-level client: simulate a base64-encoded transaction against live RPC.
 */
export class LiveSolanaSimulateClient {
  private readonly fetchImpl: typeof fetch;

  constructor(private readonly opts: LiveSolanaSimulateClientOptions) {
    if (!opts.rpcUrl?.trim()) {
      throw new Error("LiveSolanaSimulateClient requires rpcUrl");
    }
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async simulateBase64(serializedTxBase64: string): Promise<RpcSimulateResponse> {
    if (!serializedTxBase64 || typeof serializedTxBase64 !== "string") {
      throw new SimulateUnavailableError("serializedTxBase64 is required", {
        httpStatus: null,
      });
    }

    let response: Response;
    try {
      response = await this.fetchImpl(this.opts.rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "simulateTransaction",
          params: [serializedTxBase64, { ...SIMULATE_CONFIG }],
        }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new SimulateUnavailableError(`simulateTransaction network error: ${message}`, {
        httpStatus: null,
        retryAfterMs: 2_000,
      });
    }

    if (response.status === 429) {
      throw new SimulateUnavailableError("simulateTransaction rate limited (429)", {
        httpStatus: 429,
        retryAfterMs: 5_000,
      });
    }
    if (response.status >= 500) {
      throw new SimulateUnavailableError(
        `simulateTransaction server error (${response.status})`,
        { httpStatus: response.status, retryAfterMs: 5_000 },
      );
    }
    if (!response.ok) {
      throw new SimulateUnavailableError(
        `simulateTransaction HTTP ${response.status}`,
        { httpStatus: response.status },
      );
    }

    let body: {
      result?: {
        value?: {
          err?: unknown;
          logs?: string[] | null;
          unitsConsumed?: number;
          accounts?: unknown;
        };
      };
      error?: { code?: number; message?: string };
    };
    try {
      body = (await response.json()) as typeof body;
    } catch {
      throw new SimulateUnavailableError("simulateTransaction returned malformed JSON", {
        httpStatus: response.status,
      });
    }

    if (body.error) {
      const rpcCode = body.error.code ?? null;
      if (rpcCode !== null && UNAVAILABLE_RPC_CODES.has(rpcCode)) {
        throw new SimulateUnavailableError(
          `simulateTransaction RPC unavailable (${rpcCode}): ${body.error.message ?? ""}`,
          { rpcCode, retryAfterMs: 3_000 },
        );
      }
      if (rpcCode !== null && RESULT_RPC_CODES.has(rpcCode)) {
        // Simulation result (e.g. invalid tx shape) — not a transport outage
        return {
          success: false,
          errorMessage: body.error.message ?? `RPC error ${rpcCode}`,
          logs: [],
          computeUnitsConsumed: Number.MAX_SAFE_INTEGER,
          balanceChanges: [],
          touchedAccounts: [],
        };
      }
      // Unknown RPC error — fail closed as unavailable
      throw new SimulateUnavailableError(
        `simulateTransaction RPC error (${rpcCode}): ${body.error.message ?? "unknown"}`,
        { rpcCode },
      );
    }

    const value = body.result?.value;
    if (!value) {
      throw new SimulateUnavailableError("simulateTransaction missing result.value", {
        httpStatus: response.status,
      });
    }

    const err = value.err ?? null;
    const success = err === null;
    const logs = Array.isArray(value.logs) ? value.logs.filter((l): l is string => typeof l === "string") : [];

    let computeUnitsConsumed: number;
    if (typeof value.unitsConsumed === "number" && Number.isFinite(value.unitsConsumed)) {
      computeUnitsConsumed = value.unitsConsumed;
    } else {
      // Missing → must not pass COMPUTE as if zero were fine
      computeUnitsConsumed = Number.MAX_SAFE_INTEGER;
      this.opts.log?.("simulateTransaction unitsConsumed missing — COMPUTE cannot pass", {});
    }

    // Balance/touched account extraction from simulate accounts is limited
    // without pre/post account data; leave empty rather than invent.
    return {
      success,
      errorMessage: success
        ? null
        : typeof err === "string"
          ? err
          : JSON.stringify(err),
      logs,
      computeUnitsConsumed,
      balanceChanges: [],
      touchedAccounts: [],
    };
  }
}

/**
 * RpcSimulateClient adapter: resolves planId → base64 via a provided lookup,
 * then calls live simulate. Used by RpcBackedSimulationSource.
 */
export class PlanIdLiveSimulateClient implements RpcSimulateClient {
  constructor(
    private readonly live: LiveSolanaSimulateClient,
    private readonly resolveBase64: (planId: string) => string | null | Promise<string | null>,
  ) {}

  async simulateTransaction(planId: string): Promise<RpcSimulateResponse> {
    const b64 = await this.resolveBase64(planId);
    if (!b64) {
      throw new SimulateUnavailableError(
        `No serialized transaction bytes registered for planId ${planId}`,
      );
    }
    return this.live.simulateBase64(b64);
  }
}
