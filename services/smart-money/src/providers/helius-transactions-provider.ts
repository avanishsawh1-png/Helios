/**
 * Wave 6 — Helius `getTransactionsForAddress` provider.
 *
 * Returns RAW transactions only. Classification / signal aggregation stays
 * in SmartMoneyEngine (SET of wallets; single wallet cannot leave NEUTRAL).
 *
 * Fail-closed:
 *   429 / 5xx / network → throw HeliusUnavailableError
 *   empty data array → { status: "empty" }  (NOT ok)
 *   blockTime null stays null — never coerced to 0
 */

export const HELIUS_GET_TRANSACTIONS_FOR_ADDRESS = "getTransactionsForAddress";

export interface HeliusRawTransaction {
  signature: string;
  /** Unix seconds; null when the RPC omits it — never coerce to 0. */
  blockTime: number | null;
  slot: number | null;
  err: unknown;
  /** Opaque full transaction payload from Helius (message, meta, …). */
  raw: unknown;
}

export type HeliusFetchResult =
  | { status: "ok"; transactions: HeliusRawTransaction[] }
  | { status: "empty"; transactions: [] }
  | { status: "unavailable"; reason: string; retryAfterMs: number | null };

export class HeliusUnavailableError extends Error {
  readonly code = "HELIUS_UNAVAILABLE" as const;
  readonly httpStatus: number | null;
  readonly retryAfterMs: number | null;

  constructor(
    message: string,
    opts: { httpStatus?: number | null; retryAfterMs?: number | null } = {},
  ) {
    super(message);
    this.name = "HeliusUnavailableError";
    this.httpStatus = opts.httpStatus ?? null;
    this.retryAfterMs = opts.retryAfterMs ?? null;
  }
}

export interface HeliusTransactionsProviderOptions {
  /** Full HTTPS RPC URL including api-key query param (from .env.vps). */
  rpcUrl: string;
  fetchImpl?: typeof fetch;
  /** Max txs to request (Helius allows up to 1000). Default 100. */
  limit?: number;
  log?: (msg: string, fields?: Record<string, unknown>) => void;
}

export class HeliusTransactionsProvider {
  private readonly fetchImpl: typeof fetch;
  private readonly limit: number;

  constructor(private readonly opts: HeliusTransactionsProviderOptions) {
    if (!opts.rpcUrl?.trim()) {
      throw new Error("HeliusTransactionsProvider requires rpcUrl");
    }
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.limit = opts.limit ?? 100;
  }

  /**
   * Fetch raw transactions for an address. Does not classify trades.
   */
  async getTransactionsForAddress(
    address: string,
  ): Promise<HeliusFetchResult> {
    let response: Response;
    try {
      response = await this.fetchImpl(this.opts.rpcUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: HELIUS_GET_TRANSACTIONS_FOR_ADDRESS,
          params: [
            address,
            {
              transactionDetails: "full",
              sortOrder: "desc",
              limit: this.limit,
            },
          ],
        }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new HeliusUnavailableError(`Helius network error: ${message}`, {
        httpStatus: null,
        retryAfterMs: 2_000,
      });
    }

    if (response.status === 429) {
      throw new HeliusUnavailableError("Helius rate limited (429)", {
        httpStatus: 429,
        retryAfterMs: 5_000,
      });
    }
    if (response.status >= 500) {
      throw new HeliusUnavailableError(`Helius server error (${response.status})`, {
        httpStatus: response.status,
        retryAfterMs: 5_000,
      });
    }
    if (!response.ok) {
      throw new HeliusUnavailableError(`Helius HTTP ${response.status}`, {
        httpStatus: response.status,
        retryAfterMs: null,
      });
    }

    let body: {
      result?: { data?: unknown[] } | unknown[];
      error?: { message?: string; code?: number };
    };
    try {
      body = (await response.json()) as typeof body;
    } catch {
      throw new HeliusUnavailableError("Helius returned malformed JSON", {
        httpStatus: response.status,
      });
    }

    if (body.error) {
      throw new HeliusUnavailableError(
        `Helius RPC error: ${body.error.message ?? "unknown"}`,
        { httpStatus: response.status },
      );
    }

    const rows = normalizeDataArray(body.result);
    if (rows.length === 0) {
      return { status: "empty", transactions: [] };
    }

    const transactions: HeliusRawTransaction[] = [];
    for (const row of rows) {
      const parsed = parseRow(row);
      if (parsed) transactions.push(parsed);
    }

    if (transactions.length === 0) {
      return { status: "empty", transactions: [] };
    }

    this.opts.log?.("helius getTransactionsForAddress", {
      addressPrefix: address.slice(0, 8),
      count: transactions.length,
    });

    return { status: "ok", transactions };
  }
}

function normalizeDataArray(result: unknown): unknown[] {
  if (Array.isArray(result)) return result;
  if (
    result &&
    typeof result === "object" &&
    Array.isArray((result as { data?: unknown }).data)
  ) {
    return (result as { data: unknown[] }).data;
  }
  return [];
}

function parseRow(row: unknown): HeliusRawTransaction | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;

  // Helius shapes vary: { transaction, meta, slot, blockTime } or nested
  const tx = (r.transaction as Record<string, unknown> | undefined) ?? r;
  const signatures = (tx.signatures as string[] | undefined) ??
    (r.signature ? [String(r.signature)] : []);
  const signature = signatures[0];
  if (!signature) return null;

  const blockTimeRaw = r.blockTime ?? (tx as { blockTime?: unknown }).blockTime;
  let blockTime: number | null = null;
  if (typeof blockTimeRaw === "number" && Number.isFinite(blockTimeRaw)) {
    blockTime = blockTimeRaw;
  }
  // Explicit: null stays null — never 0

  const slotRaw = r.slot;
  const slot =
    typeof slotRaw === "number" && Number.isFinite(slotRaw) ? slotRaw : null;

  return {
    signature,
    blockTime,
    slot,
    err: r.err ?? (r.meta as { err?: unknown } | undefined)?.err ?? null,
    raw: row,
  };
}
