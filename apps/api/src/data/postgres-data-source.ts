/**
 * Wave 8B — Postgres-backed control-plane read models.
 * READ-ONLY via readOnlyQuery + helios_readonly role preferred.
 */
import type { Pool } from "pg";
import { readOnlyQuery } from "@helios/database";
import type {
  ControlPlaneDataSource,
  DataAvailability,
  OpportunityListItem,
  PortfolioSummary,
  PositionListItem,
} from "./types.js";

export interface PostgresControlPlaneDataSourceOptions {
  pool: Pool;
  freshnessMs?: number;
  now?: () => Date;
}

export class PostgresControlPlaneDataSource implements ControlPlaneDataSource {
  private readonly freshnessMs: number;
  private readonly now: () => Date;

  constructor(private readonly opts: PostgresControlPlaneDataSourceOptions) {
    this.freshnessMs = opts.freshnessMs ?? 120_000;
    this.now = opts.now ?? (() => new Date());
  }

  async listPositions(
    _correlationId: string,
  ): Promise<DataAvailability<PositionListItem[]>> {
    try {
      const { rows } = await readOnlyQuery<{
        id: string;
        mint: string | null;
        mode: string;
        state: string;
        entry_price: string;
        entry_amount: string;
        opened_at: Date;
      }>(
        this.opts.pool,
        `SELECT p.id, t.mint, p.mode, p.state, p.entry_price, p.entry_amount, p.opened_at
         FROM positions p
         LEFT JOIN tokens t ON t.id = p.token_id
         WHERE p.state IN ('OPEN', 'PARTIAL_EXIT', 'PENDING', 'CLOSING')
         ORDER BY p.opened_at DESC
         LIMIT 500`,
      );
      if (rows.length === 0) {
        return {
          status: "EMPTY",
          reason: "No open positions in database.",
          asOf: this.now().toISOString(),
        };
      }
      const items: PositionListItem[] = rows.map((r) => ({
        positionId: r.id,
        mint: r.mint ?? "UNKNOWN",
        mode: r.mode === "LIVE" ? "LIVE" : "PAPER",
        state: r.state,
        entryPriceUsd: toNumOrNull(r.entry_price),
        remainingAmountTokens: toNumOrNull(r.entry_amount),
        unrealizedPnlUsd: null,
        markStatus: "UNKNOWN",
      }));
      const asOf =
        latestAsOf(rows.map((r) => r.opened_at)) ?? this.now().toISOString();
      if (isStale(asOf, this.freshnessMs, this.now())) {
        return {
          status: "STALE",
          data: items,
          asOf,
          staleReason: `Positions data older than ${this.freshnessMs}ms`,
        };
      }
      return { status: "OK", data: items, asOf };
    } catch (err) {
      return {
        status: "UNAVAILABLE",
        reason: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async listOpportunities(
    _correlationId: string,
  ): Promise<DataAvailability<OpportunityListItem[]>> {
    try {
      const { rows } = await readOnlyQuery<{
        mint: string;
        symbol: string | null;
        score: string | null;
        generated_at: Date;
      }>(
        this.opts.pool,
        `SELECT t.mint, t.symbol, s.score::text AS score, s.generated_at
         FROM scores s
         INNER JOIN tokens t ON t.id = s.token_id
         ORDER BY s.generated_at DESC
         LIMIT 200`,
      );
      if (rows.length === 0) {
        return {
          status: "EMPTY",
          reason: "No scored opportunities in database.",
          asOf: this.now().toISOString(),
        };
      }
      const items: OpportunityListItem[] = rows.map((r) => ({
        mint: r.mint,
        symbol: r.symbol,
        score: toNumOrNull(r.score),
        signalState: null,
        safetyScore: null,
        asOf: new Date(r.generated_at).toISOString(),
      }));
      const asOf =
        latestAsOf(rows.map((r) => r.generated_at)) ?? this.now().toISOString();
      if (isStale(asOf, this.freshnessMs, this.now())) {
        return {
          status: "STALE",
          data: items,
          asOf,
          staleReason: `Opportunity data older than ${this.freshnessMs}ms`,
        };
      }
      return { status: "OK", data: items, asOf };
    } catch (err) {
      return {
        status: "UNAVAILABLE",
        reason: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async getPortfolio(
    _correlationId: string,
  ): Promise<DataAvailability<PortfolioSummary>> {
    try {
      const { rows } = await readOnlyQuery<{
        state: string;
        realized_pnl: string | null;
        opened_at: Date;
      }>(
        this.opts.pool,
        `SELECT state, realized_pnl, opened_at FROM positions ORDER BY opened_at DESC LIMIT 2000`,
      );
      if (rows.length === 0) {
        return {
          status: "EMPTY",
          reason: "No positions available for portfolio summary.",
          asOf: this.now().toISOString(),
        };
      }
      const open = rows.filter((r) =>
        ["OPEN", "PARTIAL_EXIT", "PENDING", "CLOSING"].includes(r.state),
      );
      let realizedSum = 0;
      let hasRealized = false;
      for (const r of rows) {
        const v = toNumOrNull(r.realized_pnl);
        if (v !== null) {
          realizedSum += v;
          hasRealized = true;
        }
      }
      const summary: PortfolioSummary = {
        balanceUsd: null,
        equityUsd: null,
        exposurePct: null,
        realizedPnlUsd: hasRealized ? realizedSum : null,
        unrealizedPnlUsd: null,
        currentDrawdownPct: null,
        markStatus: open.length > 0 ? "UNKNOWN" : "UNAVAILABLE",
        openPositionCount: open.length,
        unpricedOpenPositionCount: open.length,
        equityUnknown: true,
      };
      const asOf =
        latestAsOf(rows.map((r) => r.opened_at)) ?? this.now().toISOString();
      if (isStale(asOf, this.freshnessMs, this.now())) {
        return {
          status: "STALE",
          data: summary,
          asOf,
          staleReason: `Portfolio source older than ${this.freshnessMs}ms`,
        };
      }
      return { status: "OK", data: summary, asOf };
    } catch (err) {
      return {
        status: "UNAVAILABLE",
        reason: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

function toNumOrNull(v: string | number | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function latestAsOf(values: Array<Date | string | null | undefined>): string | null {
  let max = 0;
  for (const v of values) {
    if (!v) continue;
    const t = new Date(v).getTime();
    if (Number.isFinite(t) && t > max) max = t;
  }
  return max > 0 ? new Date(max).toISOString() : null;
}

function isStale(asOfIso: string, freshnessMs: number, now: Date): boolean {
  const t = new Date(asOfIso).getTime();
  if (!Number.isFinite(t)) return true;
  return now.getTime() - t > freshnessMs;
}
