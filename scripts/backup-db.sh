#!/bin/sh
set -eu
OUT_DIR="${BACKUP_DIR:-$HOME/backups}"
mkdir -p "$OUT_DIR"
NAME="helios-$(date +%F).sql.gz"
docker exec helios-postgres-1 pg_dump -U "${POSTGRES_USER:-helios}" "${POSTGRES_DB:-helios}" | gzip > "$OUT_DIR/$NAME"
find "$OUT_DIR" -mtime +14 -delete
echo "wrote $OUT_DIR/$NAME"
