# MASTER_WAVE_D3_REPORT — Read-model contracts

**Date:** 2026-09-24  
**Wave:** D3

## Endpoints

| Path | Model |
|------|--------|
| GET /v1/health/snapshot | HealthSnapshot |
| GET /v1/risk/state | RiskStateView |
| GET /v1/pipeline/funnel | PipelineFunnelView |
| GET /v1/portfolio/series | PortfolioSeriesView (null equity allowed) |
| GET /v1/events/recent | RecentEventsView |
| GET /v1/readiness | ProductionReadinessReport (Section 70 flags display) |

All default to UNAVAILABLE when data source not configured. RBAC: status:read.

## Gate

```
pnpm --filter @helios/api test
```
