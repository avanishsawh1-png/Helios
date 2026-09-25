/**
 * Wave D4 — Dashboard assembled from ui primitives + independent polled panels.
 * Section 70 readiness panel is DISPLAY-ONLY.
 */
import { useAuth } from "../auth/AuthContext.js";
import { usePolledAvailability } from "../lib/usePolledAvailability.js";
import {
  ChartFrame,
  DataState,
  MetricTile,
  ModeBanner,
  PanelCard,
  StatusBadge,
} from "../ui/index.js";
import type {
  ControlPlaneStatus,
  PipelineFunnelView,
  PortfolioSeriesView,
  PortfolioSummary,
  ProductionReadinessView,
  RiskStateView,
} from "../api/client.js";

const FIXTURE_MODE = import.meta.env.VITE_HELIOS_DESIGN_PREVIEW === "1";

export function DashboardPage() {
  const { client } = useAuth();

  const statusState = usePolledAvailability<ControlPlaneStatus>(() =>
    client.status().then(normalizeStatus),
  );
  const portfolioState = usePolledAvailability<PortfolioSummary>(() => client.portfolio());
  const riskState = usePolledAvailability<RiskStateView>(() => client.riskState());
  const funnelState = usePolledAvailability<PipelineFunnelView>(() => client.pipelineFunnel());
  const seriesState = usePolledAvailability<PortfolioSeriesView>(() => client.portfolioSeries());
  const readinessState = usePolledAvailability<ProductionReadinessView>(() => client.readiness());

  return (
    <div>
      <div className="topbar">
        <h1 style={{ margin: 0 }}>Dashboard</h1>
      </div>

      {FIXTURE_MODE ? (
        <p className="notice" style={{ borderColor: "var(--warn)", color: "var(--warn)" }}>
          FIXTURE DATA — NOT REAL (design-preview build flag)
        </p>
      ) : null}

      <p className="notice">
        Authorization boundary: <strong>VPS_CONTROL_GATEWAY</strong>. Section 70 flags are
        display-only — this UI cannot activate live trading.
      </p>

      <PanelCard title="Gateway">
        <DataState state={statusState} loadingLabel="Loading status…">
          {(status) => (
            <>
              <ModeBanner
                mode={status.reportedMode}
                asOf={status.reportedModeAsOf ?? status.generatedAt}
                gatewayLabel={
                  status.gatewayReachable ? `Gateway ${status.health}` : "Gateway unreachable"
                }
              />
              <div className="metric-grid">
                <MetricTile label="Mode" value={status.reportedMode} />
                <MetricTile label="Health" value={status.health} />
                <MetricTile label="Gateway" value={status.gatewayReachable ? "reachable" : null} />
                <MetricTile label="API" value={status.apiVersion} />
              </div>
            </>
          )}
        </DataState>
      </PanelCard>

      <PanelCard title="Portfolio">
        <DataState state={portfolioState} loadingLabel="Loading portfolio…">
          {(p) => (
            <div className="metric-grid">
              <MetricTile label="Equity USD" value={p.equityUsd} />
              <MetricTile label="Realized PnL" value={p.realizedPnlUsd} />
              <MetricTile label="Unrealized PnL" value={p.unrealizedPnlUsd} />
              <MetricTile label="Open positions" value={p.openPositionCount} />
              <MetricTile label="Unpriced open" value={p.unpricedOpenPositionCount} />
            </div>
          )}
        </DataState>
      </PanelCard>

      <PanelCard title="Risk state">
        <DataState state={riskState} loadingLabel="Loading risk state…">
          {(r) => (
            <div className="metric-grid">
              <MetricTile label="Kill switch" value={r.killSwitch} />
              <MetricTile label="Trades today" value={r.tradesToday} />
              <MetricTile label="Daily loss USD" value={r.dailyLossUsd} />
            </div>
          )}
        </DataState>
      </PanelCard>

      <PanelCard title="Pipeline funnel">
        <DataState state={funnelState} loadingLabel="Loading funnel…">
          {(f) => (
            <div className="metric-grid">
              <MetricTile label="Cycles" value={f.cycleCount} />
              {f.stages.map((s) => (
                <MetricTile key={s.stage} label={s.stage} value={s.count} />
              ))}
            </div>
          )}
        </DataState>
      </PanelCard>

      <PanelCard title="Equity series">
        <DataState state={seriesState} loadingLabel="Loading series…">
          {(s) => (
            <>
              {s.equityUnknown ? (
                <p className="muted">Equity unknown — nulls render as chart gaps.</p>
              ) : null}
              <ChartFrame label="Equity" values={s.points.map((p) => p.equityUsd)} />
            </>
          )}
        </DataState>
      </PanelCard>

      <PanelCard title="Production readiness (display-only)">
        <DataState state={readinessState} loadingLabel="Loading readiness…">
          {(rep) => (
            <>
              <div className="row" style={{ marginBottom: "0.75rem" }}>
                <StatusBadge kind={rep.productionReady ? "ok" : "unavailable"} />
                <span>
                  productionReady: <strong>{String(rep.productionReady)}</strong>
                </span>
              </div>
              <h3 style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Section 70 (display-only)</h3>
              <ul className="muted" style={{ fontSize: "0.85rem" }}>
                <li>paperModePass: {String(rep.liveTradingGate.paperModePass)}</li>
                <li>testnetPass: {String(rep.liveTradingGate.testnetPass)}</li>
                <li>riskTestPass: {String(rep.liveTradingGate.riskTestPass)}</li>
                <li>executionTestPass: {String(rep.liveTradingGate.executionTestPass)}</li>
                <li>recoveryTestPass: {String(rep.liveTradingGate.recoveryTestPass)}</li>
                <li>manualAdminApproval: {String(rep.liveTradingGate.manualAdminApproval)}</li>
                <li>liveModeEnabled: {String(rep.liveTradingGate.liveModeEnabled)}</li>
              </ul>
              <p className="notice" style={{ marginTop: "0.75rem" }}>
                No control on this page can set Section 70 flags.
              </p>
            </>
          )}
        </DataState>
      </PanelCard>
    </div>
  );
}

async function normalizeStatus(
  res: Awaited<ReturnType<import("../api/client.js").HeliosApiClient["status"]>>,
): Promise<
  | { ok: true; data: import("../api/client.js").DataReadResponse<ControlPlaneStatus> }
  | { ok: false; error: { error: { message: string } } }
> {
  if (!res.ok) return res;
  return {
    ok: true,
    data: {
      availability: "OK",
      status: "OK",
      data: res.data,
      asOf: res.data.generatedAt,
      correlationId: "status",
    },
  };
}
