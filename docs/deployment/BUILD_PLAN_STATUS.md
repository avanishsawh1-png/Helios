# Helios build-plan status

**Date:** 2026-09-25  
**Mode:** PAPER. Section 70 untouched.

## Done in repo this wave (Stage 1 artifacts)

- `apps/api/Dockerfile` + `/health` stub (`TRADING_MODE=PAPER`)
- `apps/web/Dockerfile` + static PAPER notice
- `services/control-gateway/Dockerfile` (not published on host :3100 in prod compose)
- `workers/pipeline/Dockerfile` (refuses LIVE)
- `infrastructure/nginx/helios.conf`
- `infrastructure/docker/docker-compose.prod.yml`
- `.env.control-plane.example` / `.env.trading-runtime.example`
- `scripts/migrate.mjs` placeholder + `scripts/backup-db.sh`

## Not done here (operator / Hostinger)

1. Provision VPS, DNS, SSH, ufw, swap, fail2ban  
2. Install Docker on the VPS  
3. Clone repo, copy env examples → real env (chmod 600)  
4. Certbot TLS  
5. `docker compose … up` against real Postgres  
6. Multi-day PAPER soak  

## Next implementable code step (after operator brings stack up)

None in this plan. Remaining work is **operator**:

1. Hostinger VPS + Docker + env + `compose.prod` up (`TRADING_MODE=PAPER`)
2. PAPER soak long enough for n≥20 outcomes
3. Only then human promotion of a scoring policy
4. Section 70 / LIVE still out of band

## Done — Stage 4 §22 (2026-09-25)

- Readiness docs updated; flags unchanged


## Done — Stage 4 §21 (2026-09-25)

- Read-only per-policy metric lines


## Done — Stage 4 §20 (2026-09-25)

- Human-only promotion; same nPnlOk window; candidate avg PnL must be higher


## Done — Stage 4 §19 (2026-09-25)

- Shadow score pair + diverge flag
- Cannot emit SIGNAL_CREATED


## Done — Stage 4 §18 (2026-09-25)

- Rule-based nudge from failure clusters
- Status PROPOSED_INACTIVE only


## Done — Stage 4 §17 (2026-09-25)

- `scoring_policy_versions` SQL + store
- Agent cannot insert `active=true`


## Done — Stage 3 §16 (2026-09-25)

- `packages/agents/src/policy-eval.ts` — min n=20


## Done — Stage 3 §15 (2026-09-25)

- SQL contract `services/migration/src/agent_run_outcomes.sql`
- Exit → runId join; null PnL not coerced to 0


## Done — Stage 3 §14 (2026-09-25)

- `packages/agents/src/run-instrumentation.ts`
- SCORE/SIGNAL events carry runId + policyVersion + snapshot

