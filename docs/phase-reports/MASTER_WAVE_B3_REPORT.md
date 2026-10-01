# MASTER_WAVE_B3_REPORT — WebSocket gateway auth/RBAC

**Date:** 2026-09-24  
**Wave:** B3

## Completed

- Real identity on WS (`GatewayIdentity`: userId, email, role).
- Unauthenticated WS upgrades rejected when `requireWsAuth` / auth port set.
- RBAC on COMMAND frames via `permissionForControlCommand` + role.
- Actor overwritten from identity (not opaque client string).
- HTTP POST /v1/commands also gated when auth injected.
- `WsControlGatewayClient` can forward `accessToken`.
- Tests in `ws-auth.test.ts`; legacy tests use `requireWsAuth: false`.

## Honest deferral

- mTLS between control-plane and trading-runtime on Hostinger not built (bearer is the control-plane auth).
- Production `GatewayAuthPort` wiring to Postgres sessions is operator/boot work.

## Gap closed

6 — WebSocket gateway has no auth/RBAC.

## Gate

```
pnpm build && pnpm typecheck && pnpm lint && pnpm test
pnpm --filter @helios/control-gateway test
```
