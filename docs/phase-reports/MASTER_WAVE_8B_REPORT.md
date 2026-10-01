# MASTER_WAVE_8B_REPORT — Postgres read models

**Date:** 2026-09-24  
**Wave:** 8B

## Read-only layers

1. `helios_readonly` SELECT-only role (migration 0014)
2. No write verbs under `apps/api/src/data` (grep test)
3. `readOnlyQuery()` rejects INSERT/UPDATE/DELETE/…

## Honesty

UNAVAILABLE / EMPTY / STALE / OK — unpriced positions use null, never fake 0 equity.

## Gate

```
pnpm --filter @helios/database test
pnpm --filter @helios/api test
```
