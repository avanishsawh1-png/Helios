# MASTER_WAVE_B1_REPORT — HTTP edge hardening

**Date:** 2026-09-24  
**Wave:** B1 (Part 0.5)

## Completed

- CORS allowlist (never *)
- Sliding-window rate limit (IP + route class); memory default; Redis store injectable; fail-closed on auth
- Security headers (CSP, XFO, XCTO, Referrer-Policy, optional HSTS)
- TLS termination docs in deployment-topology.md
- Tests in apps/api/tests/edge-hardening.test.ts

## Gaps closed (register)

1 CORS · 2 Rate limiting · 3 Security headers · 4 TLS docs

## Gate

Re-run in a fully provisioned workspace and paste raw output:

```
pnpm build && pnpm typecheck && pnpm lint && pnpm test
pnpm --filter @helios/api test
```

Install timeouts prevented capturing gate output in this agent session.
