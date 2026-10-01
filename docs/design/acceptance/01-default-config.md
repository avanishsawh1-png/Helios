# 01 — Dashboard against real API in DEFAULT config

## Expected (spec)

With `UnavailableDataSource` / no `DATABASE_READONLY_URL` and no gateway:

| Panel | Expected status | Must NOT show |
|-------|-----------------|---------------|
| Gateway | OK or UNAVAILABLE from `/v1/status` | Fake LIVE mode |
| Portfolio | **UNAVAILABLE** + reason | `$0` equity |
| Risk state | **UNAVAILABLE** + reason | Invented kill-switch “healthy” green |
| Pipeline funnel | **UNAVAILABLE** | Empty table pretending to be zero cycles |
| Equity series | **UNAVAILABLE** or empty chart message | Line forced through 0 |
| Readiness | **UNAVAILABLE** or report with `productionReady: false` | Green “ready” |

Mode banner visible on every authenticated page (Shell).

## Agent session evidence

| Check | Result |
|-------|--------|
| API handlers default UNAVAILABLE | **Verified** (Wave D3 unit tests) |
| `mapDataReadToUi` UNAVAILABLE path | **Verified** (Wave D4 unit tests) |
| MetricTile null → `—` | **Verified** (Wave D2 unit tests) |
| Live browser screenshot vs running API | **NOT captured** in-agent |

## Operator procedure

```bash
# Terminal A
cd apps/api && TRADING_MODE=PAPER pnpm dev   # or monorepo start without DB data source

# Terminal B
cd apps/web && pnpm dev
# Login → Dashboard → photograph each panel
```

Save images as:

- `screenshots/default-gateway.png`
- `screenshots/default-portfolio-unavailable.png`
- `screenshots/default-readiness.png`
