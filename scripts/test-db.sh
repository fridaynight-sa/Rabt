#!/usr/bin/env bash
# Runs the database migrations and security tests against a throwaway local Postgres.
# Needs PostgreSQL 15+ binaries (initdb, pg_ctl, psql). Nothing touches the real database.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

PGBIN="$(dirname "$(command -v initdb 2>/dev/null || ls -d /usr/lib/postgresql/*/bin/initdb | sort -V | tail -1)")"
WORK="$(mktemp -d)"
PORT="${TEST_DB_PORT:-54329}"

# initdb refuses to run as root; use the postgres system user when we are root.
RUN=()
if [ "$(id -u)" = "0" ]; then
  RUN=(runuser -u postgres --)
  chown postgres "$WORK"
fi

cleanup() {
  "${RUN[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true
  rm -rf "$WORK"
}
trap cleanup EXIT

"${RUN[@]}" "$PGBIN/initdb" -D "$WORK/data" -U postgres --auth=trust -E UTF8 --locale=C.UTF-8 >/dev/null
"${RUN[@]}" "$PGBIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK -c listen_addresses=''" -l "$WORK/log" -w start >/dev/null

PSQL=("$PGBIN/psql" -h "$WORK" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X -o /dev/null)

echo "Setting up a Supabase-like database..."
"${PSQL[@]}" -f "$ROOT/supabase/tests/setup/supabase_stub.sql"

for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "Migration: $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done

status=0
for f in "$ROOT"/supabase/tests/*.sql; do
  echo "Test file: $(basename "$f")"
  "${PSQL[@]}" -f "$f" 2>&1 | sed -E "s/^psql:[^ ]+ NOTICE:  /  /" || status=1
done

if [ "$status" = "0" ]; then
  echo "All database tests passed."
else
  echo "Database tests FAILED." >&2
fi
exit "$status"
