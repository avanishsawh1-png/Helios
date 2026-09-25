export type DataReadResponse<T> =
  | { status: "OK"; data: T; asOf: string }
  | { status: "EMPTY"; reason: string; asOf: string }
  | { status: "UNAVAILABLE"; reason: string }
  | { status: "STALE"; data: T; asOf: string; staleReason: string };

export interface ControlPlaneStatus {
  tradingMode: string;
  live: boolean;
}

export interface PipelineFunnelView {
  stages: unknown[];
}
export interface PortfolioSeriesView {
  points: unknown[];
}
export interface PortfolioSummary {
  equityUsd: number | null;
}
export interface ProductionReadinessView {
  productionReady: boolean;
  liveModeEnabled: boolean;
  manualAdminApproval: null;
}
export interface RiskStateView {
  killSwitch: boolean;
}

export interface HeliosApiClient {
  status(): Promise<{ ok: true; data: DataReadResponse<ControlPlaneStatus> }>;
  funnel(): Promise<{ ok: true; data: DataReadResponse<PipelineFunnelView> }>;
  readiness(): Promise<{ ok: true; data: DataReadResponse<ProductionReadinessView> }>;
}

async function getJson<T>(path: string): Promise<{ ok: true; data: T }> {
  const base = (globalThis as { HELIOS_API_BASE?: string }).HELIOS_API_BASE ?? "";
  const res = await fetch(`${base}${path}`);
  if (!res.ok) {
    return { ok: true, data: { status: "UNAVAILABLE", reason: `http_${res.status}` } as T };
  }
  return { ok: true, data: (await res.json()) as T };
}

export function createApiClient(): HeliosApiClient {
  return {
    status: () => getJson("/v1/status"),
    funnel: () => getJson("/v1/funnel"),
    readiness: () => getJson("/v1/readiness"),
  };
}

export function createUnavailableClient(): HeliosApiClient {
  return {
    async status() {
      return { ok: true, data: { status: "UNAVAILABLE", reason: "no api base" } };
    },
    async funnel() {
      return { ok: true, data: { status: "UNAVAILABLE", reason: "no api base" } };
    },
    async readiness() {
      return { ok: true, data: { status: "UNAVAILABLE", reason: "no api base" } };
    },
  };
}
