#!/usr/bin/env sh
set -eu
: "${REPLICA_CONTAINER:?REPLICA_CONTAINER is required}"
started=$(date +%s)
docker exec "$REPLICA_CONTAINER" pg_ctl -D "${PGDATA:-/var/lib/postgresql/data}" promote
until docker exec "$REPLICA_CONTAINER" pg_isready -q; do sleep 1; done
ended=$(date +%s)
printf 'promotion_seconds=%s\nreplica=%s\n' "$((ended-started))" "$REPLICA_CONTAINER"
