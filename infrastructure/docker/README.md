# infrastructure/docker

Target host: **Hostinger VPS** (Replit is not used).

## VPS local dependencies

```bash
docker compose -f infrastructure/docker/docker-compose.vps.yml up -d
```

Starts **Postgres 16** and **Redis 7** only. It does **not**:

- start `LiveExecutionEngine`
- mount wallet keys
- set `TRADING_MODE=LIVE`

Point `.env.vps` / `.env.control-plane` `DATABASE_URL` and `REDIS_URL` at these ports for local development.

Backups: not configured by this compose file — `PRODUCTION_READINESS.md` keeps **Backups configured** unchecked until an operator verifies pg_dump/WAL retention.
