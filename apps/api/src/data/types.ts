/**
 * Phase R9 — read models for the control-plane UI.
 * Discriminated availability: never invent rows, prices, or equity.
 */

export type DataAvailability<T> =
  | { status: "OK"; data: T; asOf: string }
  | { status: "EMPTY"; reason: string; asOf: string }
  | { status: "UNAVAILABLE"; reason: string }
  | { status: "STALE"; data: T; asOf: string; staleReason: string };

export interface PositionListItem {
  positionId: string;
  mint: string;
  mode: "PAPER" | "LIVE";
  state: string;
  entryPriceUsd: number | null;
  remainingAmountTokens: number | null;
  unrealizedPnlUsd: number | null;
  markStatus: "OK" | "STALE" | "UNKNOWN";
}

export interface OpportunityListItem {
  mint: string;
  symbol: string | null;
  score: number | null;
  signalState: string | null;
  safetyScore: number | null;
  /** Score/signal timestamps — null when not yet analyzed. */
  asOf: string | null;
}

export interface PortfolioSummary {
  balanceUsd: number | null;
  equityUsd: number | null;
  exposurePct: number | null;
  realizedPnlUsd: number | null;
  unrealizedPnlUsd: number | null;
  currentDrawdownPct: number | null;
  markStatus: "OK" | "STALE" | "UNKNOWN" | "UNAVAILABLE";
  openPositionCount: number;
  unpricedOpenPositionCount: number;
  equityUnknown: boolean;
}

/**
 * Optional data plane behind apps/api. When null, handlers return UNAVAILABLE.
 * Track A wires real repos/gateway mirrors; Hostinger must not fabricate.
 */

/** Wave D3 — additive read models (always DataAvailability-wrapped). */

export interface RiskStateView {
  killSwitch: string | null;
  tradesToday: number | null;
  dailyLossUsd: number | null;
  recentDecisionCodes: string[];
  asOf: string | null;
}

export interface PipelineFunnelStage {
  stage: string;
  count: number | null;
  lastEventAgeMs: number | null;
}

export interface PipelineFunnelView {
  stages: PipelineFunnelStage[];
  cycleCount: number | null;
  asOf: string | null;
}

export interface PortfolioSeriesPoint {
  t: string;
  equityUsd: number | null;
  realizedPnlUsd: number | null;
}

export interface PortfolioSeriesView {
  points: PortfolioSeriesPoint[];
  equityUnknown: boolean;
}

export interface RecentEventItem {
  id: string;
  kind: string;
  message: string;
  at: string;
}

export interface RecentEventsView {
  items: RecentEventItem[];
  nextCursor: string | null;
}

export interface ControlPlaneDataSource {
  listPositions(correlationId: string): Promise<DataAvailability<PositionListItem[]>>;
  listOpportunities(correlationId: string): Promise<DataAvailability<OpportunityListItem[]>>;
  getPortfolio(correlationId: string): Promise<DataAvailability<PortfolioSummary>>;
  getHealthSnapshot?(correlationId: string): Promise<DataAvailability<import("@helios/types").HealthSnapshot>>;
  getRiskState?(correlationId: string): Promise<DataAvailability<RiskStateView>>;
  getPipelineFunnel?(correlationId: string): Promise<DataAvailability<PipelineFunnelView>>;
  getPortfolioSeries?(correlationId: string): Promise<DataAvailability<PortfolioSeriesView>>;
  getRecentEvents?(correlationId: string, cursor?: string): Promise<DataAvailability<RecentEventsView>>;
  getReadiness?(correlationId: string): Promise<DataAvailability<import("@helios/types").ProductionReadinessReport>>;
}

/** Default: honest UNAVAILABLE — no silent empty arrays pretending to be a live feed. */
export class UnavailableDataSource implements ControlPlaneDataSource {
  async listPositions(): Promise<DataAvailability<PositionListItem[]>> {
    return {
      status: "UNAVAILABLE",
      reason: "Position data source not configured on this API instance.",
    };
  }

  async listOpportunities(): Promise<DataAvailability<OpportunityListItem[]>> {
    return {
      status: "UNAVAILABLE",
      reason: "Opportunity / signal feed not configured on this API instance.",
    };
  }

  async getPortfolio(): Promise<DataAvailability<PortfolioSummary>> {
    return {
      status: "UNAVAILABLE",
      reason: "Portfolio snapshot source not configured on this API instance.",
    };
  }

  async getHealthSnapshot(): Promise<DataAvailability<import("@helios/types").HealthSnapshot>> {
    return { status: "UNAVAILABLE", reason: "Health snapshot source not configured." };
  }
  async getRiskState(): Promise<DataAvailability<RiskStateView>> {
    return { status: "UNAVAILABLE", reason: "Risk state source not configured." };
  }
  async getPipelineFunnel(): Promise<DataAvailability<PipelineFunnelView>> {
    return { status: "UNAVAILABLE", reason: "Pipeline funnel source not configured." };
  }
  async getPortfolioSeries(): Promise<DataAvailability<PortfolioSeriesView>> {
    return { status: "UNAVAILABLE", reason: "Portfolio series source not configured." };
  }
  async getRecentEvents(): Promise<DataAvailability<RecentEventsView>> {
    return { status: "UNAVAILABLE", reason: "Events feed source not configured." };
  }
  async getReadiness(): Promise<DataAvailability<import("@helios/types").ProductionReadinessReport>> {
    return { status: "UNAVAILABLE", reason: "Production readiness source not configured." };
  }
}

/**
 * In-memory source for tests — can return EMPTY or fixed rows without claiming
 * they came from chain data.
 */
export class InMemoryDataSource implements ControlPlaneDataSource {
  constructor(
    private readonly state: {
      positions?: DataAvailability<PositionListItem[]>;
      opportunities?: DataAvailability<OpportunityListItem[]>;
      portfolio?: DataAvailability<PortfolioSummary>;
    } = {},
  ) {}

  async listPositions(): Promise<DataAvailability<PositionListItem[]>> {
    return (
      this.state.positions ?? {
        status: "EMPTY",
        reason: "No open positions in memory store.",
        asOf: new Date().toISOString(),
      }
    );
  }

  async listOpportunities(): Promise<DataAvailability<OpportunityListItem[]>> {
    return (
      this.state.opportunities ?? {
        status: "EMPTY",
        reason: "No scored opportunities in memory store.",
        asOf: new Date().toISOString(),
      }
    );
  }

  async getPortfolio(): Promise<DataAvailability<PortfolioSummary>> {
    return (
      this.state.portfolio ?? {
        status: "EMPTY",
        reason: "No portfolio snapshot in memory store.",
        asOf: new Date().toISOString(),
      }
    );
  }
}
