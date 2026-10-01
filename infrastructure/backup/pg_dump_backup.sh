#!/usr/bin/env bash
# Wave 9 — Hostinger VPS friendly backup (pg_dump, not WAL).
# Usage: DATABASE_URL=postgres://... ./infrastructure/backup/pg_dump_backup.sh /path/to/backup-dir
set -euo pipefail
DEST="${1:-./backups}"
mkdir -p "$DEST"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
OUT="$DEST/helios_${STAMP}.sql.gz"
: "${DATABASE_URL:?DATABASE_URL is required}"
echo "Writing $OUT"
pg_dump "$DATABASE_URL" --no-owner --no-privileges | gzip -c > "$OUT"
echo "OK $(wc -c < "$OUT") bytes"
# Optional off-box copy (operator fills in):
# scp "$OUT" backup-host:/offbox/helios/
