# Monorepo packing

This zip is a **partial** Helios workspace. Packed packages all have `package.json` + `pnpm-workspace.yaml`.

## In this zip (14)

| Path | Name |
|---|---|
| apps/api | @helios/api |
| apps/web | @helios/web |
| packages/agents | @helios/agents |
| packages/database | @helios/database |
| packages/runtime | @helios/runtime |
| packages/shared | @helios/shared |
| packages/solana | @helios/solana |
| services/control-gateway | @helios/services-control-gateway |
| services/execution | @helios/execution |
| services/exits | @helios/exits |
| services/migration | @helios/migration |
| services/quote | @helios/quote |
| services/smart-money | @helios/smart-money |
| services/transaction-simulator | @helios/transaction-simulator |
| workers/pipeline | @helios/worker-pipeline |

## Not in this handoff (do not invent)

risk, discovery, scoring, signal, position, monitoring, config package, wallet module.

## Declared dependencies

- `@helios/api` → workspace `@helios/database`, `@helios/runtime`, npm `pg`
- `@helios/database` → npm `pg`
- `@helios/migration` → workspace `@helios/solana`, npm `@solana/web3.js`
- `@helios/web` → npm `react`, `react-dom` (+ vitest / testing-library dev)
- `@helios/exits`, `@helios/smart-money` → vitest (dev)

