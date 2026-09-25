# 02 — Panel × state coverage

## Unit evidence (automated)

| State | Evidence |
|-------|----------|
| loading | `DataState` test (D2) |
| OK | `DataState` + `mapDataReadToUi` (D2/D4) |
| EMPTY | D2 + D3 + D4 tests |
| UNAVAILABLE | D2 + D3 + D4 tests |
| STALE | D2 + D4 tests |
| error | D2 + D4 transport error mapping |

## Design-preview screenshots

**Not captured in-agent.** To produce:

```bash
cd apps/web
VITE_HELIOS_DESIGN_PREVIEW=1 pnpm dev
```

Banner must read: `FIXTURE DATA — NOT REAL`.

Attach screenshots per panel × state under `screenshots/preview/`.
