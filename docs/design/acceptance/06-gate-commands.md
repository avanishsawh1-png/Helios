# 06 — Gate commands

## Intended gate

```bash
pnpm --filter @helios/web test
pnpm --filter @helios/web typecheck
pnpm --filter @helios/web build
pnpm --filter @helios/api test
```

## Session results (agent)

| Command | Result |
|---------|--------|
| Wave D2 UI unit tests (DataState, ChartFrame, MetricTile) | **10 passed** (isolated vitest) |
| Wave D3 read-model handler tests | **4 passed** |
| Wave D4 mapDataReadToUi tests | **6 passed** |
| Full `pnpm --filter @helios/web test` monorepo | **Not run** (workspace install limits) |
| `pnpm --filter @helios/web build` | **Not run** |
| Live API + browser screenshot | **Not captured** |

Paste future CI output below:

```
(operator pastes verbatim)
```
