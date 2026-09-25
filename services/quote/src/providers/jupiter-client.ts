/**
 * Wave 5 — live Jupiter quote client.
 *
 * Endpoint: GET https://api.jup.ag/swap/v1/quote
 * Header:   x-api-key: <key>  (never logged)
 *
 * Fail-closed:
 *   429 → throw with retryAfterMs from x-ratelimit-reset (Unix seconds)
 *   400/401/403/404 → throw (no retry)
 *   5xx → throw with retry hint
 *   network / malformed JSON / missing outAmount → throw or null route
 *
 * Logs only x-api-gateway-request-id, never the API key.
 */

import type { AggregatorClient, AggregatorQuoteResponse } from "./upstream.js";

export const JUPITER_QUOTE_URL = "https://api.jup.ag/swap/v1/quote";

export class JupiterUnavailableError extends Error {
  readonly code = "JUPITER_UNAVAILABLE" as const;
  readonly httpStatus: number | null;
  readonly retryAfterMs: number | null;
  readonly requestId: string | null;

  constructor(
    message: string,
    opts: {
      httpStatus?: number | null;
      retryAfterMs?: number | null;
      requestId?: string | null;
    } = {},
  ) {
    super(message);
    this.name = "JupiterUnavailableError";
    this.httpStatus = opts.httpStatus ?? null;
    this.retryAfterMs = opts.retryAfterMs ?? null;
    this.requestId = opts.requestId ?? null;
  }
}

export interface JupiterClientOptions {
  apiKey: string;
  /** Override base URL (tests). Default: JUPITER_QUOTE_URL */
  baseUrl?: string;
  /** Injectable fetch for tests. */
  fetchImpl?: typeof fetch;
  /** Optional logger — must never receive the API key. */
  log?: (msg: string, fields?: Record<string, unknown>) => void;
  /** Slippage BPs passed to Jupiter (default 50 = 0.5%). */
  slippageBps?: number;
}

interface JupiterQuoteJson {
  inputMint?: string;
  outputMint?: string;
  inAmount?: string;
  outAmount?: string;
  priceImpactPct?: string | number;
  routePlan?: Array<{
    swapInfo?: {
      label?: string;
      inputMint?: string;
      outputMint?: string;
    };
    percent?: number;
  }>;
  timeTaken?: number;
}

export class JupiterAggregatorClient implements AggregatorClient {
  private readonly fetchImpl: typeof fetch;
  private readonly baseUrl: string;
  private readonly slippageBps: number;

  constructor(private readonly opts: JupiterClientOptions) {
    if (!opts.apiKey || opts.apiKey.trim().length === 0) {
      throw new Error("JupiterAggregatorClient requires a non-empty apiKey");
    }
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.baseUrl = opts.baseUrl ?? JUPITER_QUOTE_URL;
    this.slippageBps = opts.slippageBps ?? 50;
  }

  async quote(params: {
    inputMint: string;
    outputMint: string;
    amountBaseUnits: string;
  }): Promise<AggregatorQuoteResponse | null> {
    const url = new URL(this.baseUrl);
    url.searchParams.set("inputMint", params.inputMint);
    url.searchParams.set("outputMint", params.outputMint);
    url.searchParams.set("amount", params.amountBaseUnits);
    url.searchParams.set("slippageBps", String(this.slippageBps));

    let response: Response;
    try {
      response = await this.fetchImpl(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
          "x-api-key": this.opts.apiKey,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new JupiterUnavailableError(`Jupiter network error: ${message}`, {
        httpStatus: null,
        retryAfterMs: 2_000,
      });
    }

    const requestId =
      response.headers.get("x-api-gateway-request-id") ??
      response.headers.get("x-request-id") ??
      null;

    this.opts.log?.("jupiter quote response", {
      status: response.status,
      requestId,
      // never log api key
    });

    if (response.status === 429) {
      const retryAfterMs = parseRetryAfter(response);
      throw new JupiterUnavailableError("Jupiter rate limited (429)", {
        httpStatus: 429,
        retryAfterMs,
        requestId,
      });
    }

    if (
      response.status === 400 ||
      response.status === 401 ||
      response.status === 403 ||
      response.status === 404
    ) {
      throw new JupiterUnavailableError(
        `Jupiter client error (${response.status})`,
        { httpStatus: response.status, retryAfterMs: null, requestId },
      );
    }

    if (response.status >= 500) {
      throw new JupiterUnavailableError(
        `Jupiter server error (${response.status})`,
        { httpStatus: response.status, retryAfterMs: 5_000, requestId },
      );
    }

    if (!response.ok) {
      throw new JupiterUnavailableError(
        `Jupiter unexpected status (${response.status})`,
        { httpStatus: response.status, retryAfterMs: null, requestId },
      );
    }

    let body: JupiterQuoteJson;
    try {
      body = (await response.json()) as JupiterQuoteJson;
    } catch {
      throw new JupiterUnavailableError("Jupiter returned malformed JSON", {
        httpStatus: response.status,
        requestId,
      });
    }

    if (!body.outAmount || typeof body.outAmount !== "string") {
      // No route / empty quote — honest null, not a fabricated amount
      return null;
    }

    const priceImpactPercent = parsePriceImpact(body.priceImpactPct);
    const routeSteps =
      body.routePlan?.map((step) => ({
        dex: step.swapInfo?.label ?? "unknown",
        inputMint: step.swapInfo?.inputMint ?? params.inputMint,
        outputMint: step.swapInfo?.outputMint ?? params.outputMint,
        percent: typeof step.percent === "number" ? step.percent : 100,
      })) ?? [
        {
          dex: "jupiter",
          inputMint: params.inputMint,
          outputMint: params.outputMint,
          percent: 100,
        },
      ];

    // priceUsd is not always in the quote response; leave 0 rather than invent.
    // QuoteEngine / risk treat impact and amounts as primary; USD is optional context.
    return {
      inputMint: body.inputMint ?? params.inputMint,
      outputMint: body.outputMint ?? params.outputMint,
      outputAmount: body.outAmount,
      priceUsd: null,
      priceImpactPercent,
      routeSteps,
      sampledAt: new Date().toISOString(),
    };
  }
}

function parsePriceImpact(value: string | number | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/**
 * Prefer `x-ratelimit-reset` (Unix seconds) → ms until that time.
 * Fallback: Retry-After header seconds.
 */
export function parseRetryAfter(response: {
  headers: { get(name: string): string | null };
}): number | null {
  const reset = response.headers.get("x-ratelimit-reset");
  if (reset) {
    const unixSec = Number(reset);
    if (Number.isFinite(unixSec) && unixSec > 1_000_000_000) {
      const ms = unixSec * 1000 - Date.now();
      return ms > 0 ? ms : 0;
    }
    // some gateways send delta seconds in this header
    if (Number.isFinite(unixSec) && unixSec >= 0 && unixSec < 86_400) {
      return Math.floor(unixSec * 1000);
    }
  }
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const sec = Number(retryAfter);
    if (Number.isFinite(sec) && sec >= 0) return Math.floor(sec * 1000);
  }
  return 5_000;
}
