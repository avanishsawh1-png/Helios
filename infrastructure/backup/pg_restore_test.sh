#!/usr/bin/env bash
# Wave 9 — restore test: a backup is not real until restore works.
# Creates a temporary database, restores the dump, runs a smoke query.
# Usage: DATABASE_URL=postgres://helios:...@localhost:5432/postgres \
#        ./infrastructure/backup/pg_restore_test.sh ./backups/helios_XXXX.sql.gz
set -euo pipefail
DUMP="${1:?path to .sql.gz required}"
: "${DATABASE_URL:?DATABASE_URL is required (connect to maintenance DB)}"
TMP_DB="helios_restore_$(date +%s)"
echo "Creating $TMP_DB"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${TMP_DB};"
RESTORE_URL=$(echo "$DATABASE_URL" | sed "s#[^/]*\$#${TMP_DB}#")
echo "Restoring into $TMP_DB"
gunzip -c "$DUMP" | psql "$RESTORE_URL" -v ON_ERROR_STOP=1
echo "Smoke: count schema_migrations"
psql "$RESTORE_URL" -c "SELECT COUNT(*) AS migrations FROM schema_migrations;" || \
  psql "$RESTORE_URL" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
echo "Dropping $TMP_DB"
psql "$DATABASE_URL" -c "DROP DATABASE ${TMP_DB};"
echo "RESTORE TEST OK"
