#!/usr/bin/env sh
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKUP_DIR:?BACKUP_DIR is required}"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
target="$BACKUP_DIR/base-$stamp"
mkdir -p "$target"
pg_basebackup --dbname="$DATABASE_URL" --format=tar --gzip --wal-method=stream --checkpoint=fast --destination="$target"
printf '%s\n' "backup_completed_at=$stamp" "target=$target" > "$target/manifest.txt"
printf 'Backup complete: %s\n' "$target"
