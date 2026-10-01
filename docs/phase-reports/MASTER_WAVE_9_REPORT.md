# MASTER_WAVE_9_REPORT — CI / containers / backups

**Date:** 2026-09-24  
**Wave:** 9

## Delivered

- CI workflow with Postgres + Redis
- Docker templates (non-root, PAPER default, execution no-keys-at-build)
- Compose: api/web → `.env.control-plane`; gateway/pipeline → `.env.vps`
- pg_dump + restore-test scripts (Hostinger VM appropriate)
- secrets.md rotation docs

## Not verified here

GitHub Actions execution, full image builds, live restore test, password rotation on shared DB.

## Gate (operator)

```
# on CI or provisioned host
pnpm install --frozen-lockfile
pnpm build && pnpm typecheck && pnpm lint && pnpm test
./infrastructure/backup/pg_dump_backup.sh ./backups
./infrastructure/backup/pg_restore_test.sh ./backups/helios_*.sql.gz
```
