# MASTER_WAVE_B2_REPORT — Boot-time fail-closed auth

**Date:** 2026-09-24  
**Wave:** B2

## Completed

- Refuse `createApiServer` in production (`NODE_ENV=production`) or when
  `requireAuth: true` if `AuthEngine` is not injected → `AuthEngineRequiredError`.
- Auth remains optional for existing tests (no requireAuth, non-production NODE_ENV).
- Test: `apps/api/tests/boot-auth.test.ts` proves production-mode start without
  AuthEngine fails closed.
- README boot contract documented.

## Not changed

- Password hashing, session storage, lockout, RBAC enforcement paths.

## Gap closed

5 — Auth optional at boot.

## Gate

```
pnpm build && pnpm typecheck && pnpm lint && pnpm test
pnpm --filter @helios/api test
```

Paste raw output when dependencies are available.
