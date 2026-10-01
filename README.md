# Helios

PAPER-mode Solana trading control plane + pipeline (partial monorepo).

**Hostinger VPS** only. Live trading gate is **closed**. No wallet private keys in this repo.

## Layout

- `apps/api` — control-plane HTTP (`/health`, read models)
- `apps/web` — dashboard UI (PAPER notice)
- `packages/*` — agents, database, runtime, shared, solana
- `services/*` — exits, quote, smart-money, simulator, control-gateway, execution (inert live engine)
- `workers/pipeline` — PAPER cycle runner
- `infrastructure/docker` — Hostinger compose

## Quick start (local)

```bash
cp .env.control-plane.example .env.control-plane
cp .env.trading-runtime.example .env.trading-runtime
# do not commit those files

node workers/pipeline/src/leftover-e2e.cjs
node services/execution/src/live-engine-gate.cjs
```

`TRADING_MODE` stays `PAPER`. `LiveExecutionEngine` will not submit.

## GitHub upload

Do **not** drag 300+ files in the website. Use git push — see `docs/deployment/GITHUB.md`.
