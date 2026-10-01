export type DataReadResponse<T> =
  | { status: "OK"; data: T; asOf: string }
  | { status: "EMPTY"; reason: string; asOf: string }
  | { status: "UNAVAILABLE"; reason: string }
  | { status: "STALE"; data: T; asOf: string; staleReason: string };

export interface ControlPlaneStatus {
  tradingMode: string;
  live: boolean;
}

export interface SolBalanceLeg {
  availability: string;
  reason?: string;
  pubkey: string | null;
  lamports: number | null;
  sol: number | null;
  note?: string;
}

export interface SolBalancesView {
  tradingMode: string;
  liveTradingEnabled: boolean;
  paper: SolBalanceLeg;
  live: SolBalanceLeg;
}

export interface PipelineFunnelView {
  stages: { stage: string; count?: number }[];
  cycleCount?: number;
}
export interface PortfolioSeriesView {
  points: { equityUsd: number | null }[];
  equityUnknown?: boolean;
}
export interface PortfolioSummary {
  equityUsd: number | null;
  realizedPnlUsd?: number | null;
  unrealizedPnlUsd?: number | null;
  openPositionCount?: number | null;
  unpricedOpenPositionCount?: number | null;
}
export interface ProductionReadinessView {
  productionReady: boolean;
  liveModeEnabled: boolean;
  manualAdminApproval: null;
}
export interface RiskStateView {
  killSwitch?: boolean | string | null;
  tradesToday?: number | null;
  dailyLossUsd?: number | null;
}

export interface HeliosApiClient {
  status(): Promise<{ ok: true; data: DataReadResponse<ControlPlaneStatus> }>;
  funnel(): Promise<{ ok: true; data: DataReadResponse<PipelineFunnelView> }>;
  readiness(): Promise<{ ok: true; data: DataReadResponse<ProductionReadinessView> }>;
  balances(): Promise<{ ok: true; data: DataReadResponse<SolBalancesView> }>;
  portfolio(): Promise<{ ok: true; data: DataReadResponse<PortfolioSummary> }>;
  riskState(): Promise<{ ok: true; data: DataReadResponse<RiskStateView> }>;
  pipelineFunnel(): Promise<{ ok: true; data: DataReadResponse<PipelineFunnelView> }>;
  portfolioSeries(): Promise<{ ok: true; data: DataReadResponse<PortfolioSeriesView> }>;
}

async function getJson<T>(path: string): Promise<{ ok: true; data: T }> {
  const base = (globalThis as { HELIOS_API_BASE?: string }).HELIOS_API_BASE ?? "";
  try {
    const res = await fetch(`${base}${path}`);
    if (!res.ok) {
      return { ok: true, data: { status: "UNAVAILABLE", reason: `http_${res.status}` } as T };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (err) {
    return {
      ok: true,
      data: { status: "UNAVAILABLE", reason: err instanceof Error ? err.message : "fetch_failed" } as T,
    };
  }
}

function unavailable<T>(reason: string): { ok: true; data: DataReadResponse<T> } {
  return { ok: true, data: { status: "UNAVAILABLE", reason } };
}

export function createApiClient(): HeliosApiClient {
  return {
    status: () => getJson("/v1/status"),
    funnel: () => getJson("/v1/funnel"),
    pipelineFunnel: () => getJson("/v1/funnel"),
    readiness: () => getJson("/v1/readiness"),
    balances: () => getJson("/v1/balances"),
    portfolio: () => getJson("/v1/portfolio"),
    riskState: () => getJson("/v1/risk"),
    portfolioSeries: () => getJson("/v1/series"),
  };
}

export function createUnavailableClient(): HeliosApiClient {
  const miss = (reason = "no api base") => unavailable(reason);
  return {
    status: () => miss(),
    funnel: () => miss(),
    pipelineFunnel: () => miss(),
    readiness: () => miss(),
    balances: () => miss(),
    portfolio: () => miss(),
    riskState: () => miss(),
    portfolioSeries: () => miss(),
  };
}
