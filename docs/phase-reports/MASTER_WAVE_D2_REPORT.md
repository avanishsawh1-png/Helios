# MASTER_WAVE_D2_REPORT — Design system & shell

**Date:** 2026-09-24  
**Wave:** D2

## Primitives

DataState (only availability renderer), PanelCard, MetricTile, StatusBadge,
ModeBanner, KillSwitchIndicator, FreshnessStamp, DataTable, ChartFrame.

## Chart library

None added. Custom SVG `ChartFrame` with null-as-gap. Rationale: no series DTOs
on apps/api; avoid implying live charts.

## Gate

```
pnpm --filter @helios/web test
pnpm --filter @helios/web typecheck
```
