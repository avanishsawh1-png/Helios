# MASTER_WAVE_B4_REPORT — Secrets, redaction, role-scope

**Date:** 2026-09-24  
**Wave:** B4

## Completed

1. Value-pattern redaction in `packages/shared/src/logger.ts` (JWT, Bearer, hex, long base58, assignment forms).
2. Role scope: `helios_app` (write) + `helios_readonly` (SELECT-only) via migration 0014.
3. Placeholder password policy: runbook requires rotation before non-dev; no new password in git.
4. Tests extended in `logger.test.ts`.

## Not changed

- `audit_logs` REVOKE UPDATE/DELETE (append-only) preserved.

## Gaps closed

7 redaction · 8 role scope · 9 placeholder password policy

## Gate

```
pnpm build && pnpm typecheck && pnpm lint && pnpm test
pnpm --filter @helios/shared test
```
