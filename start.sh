#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
set -a
# shellcheck disable=SC1091
source "$project_dir/.env"
set +a
export NODE_ENV=development
export NEXTAUTH_URL="http://127.0.0.1:$FRONTEND_PORT"

mode="${1:-start}"
case "$mode" in
  start) ;;
  migrate) cd "$project_dir"; npm run db:generate; exec npm run db:migrate:deploy ;;
  check) cd "$project_dir"; exec npm run check ;;
  *) echo 'usage: ./start.sh [start|migrate|check]' >&2; exit 2 ;;
esac

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKEND_PORT:?BACKEND_PORT is required}"
: "${FRONTEND_PORT:?FRONTEND_PORT is required}"
: "${NEXTAUTH_SECRET:?NEXTAUTH_SECRET is required}"
: "${OPENROUTER_API_KEY:?OPENROUTER_API_KEY is required}"
: "${OPENROUTER_MODEL:?OPENROUTER_MODEL is required}"
[[ "${OPENROUTER_BASE_URL:-}" == 'https://openrouter.ai/api/v1' ]] || { echo 'Canonical OPENROUTER_BASE_URL is required' >&2; exit 1; }
[[ "$BACKEND_PORT" != "$FRONTEND_PORT" ]] || { echo 'Assigned ports must differ' >&2; exit 1; }
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  [[ "$port" =~ ^[0-9]+$ ]] || { echo 'Assigned ports must be numeric' >&2; exit 1; }
  ! lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 || { echo "Port $port is occupied" >&2; exit 1; }
done

cd "$project_dir"
npm run db:generate
npm run db:migrate:deploy
npm run create-admin
api_pid=''; proxy_pid=''
cleanup() {
  trap - INT TERM EXIT
  [[ -z "$proxy_pid" ]] || kill "$proxy_pid" 2>/dev/null || true
  [[ -z "$api_pid" ]] || kill "$api_pid" 2>/dev/null || true
  [[ -z "$proxy_pid" ]] || wait "$proxy_pid" 2>/dev/null || true
  [[ -z "$api_pid" ]] || wait "$api_pid" 2>/dev/null || true
}
trap cleanup INT TERM EXIT
npm run dev -- --hostname 127.0.0.1 --port "$BACKEND_PORT" & api_pid=$!
for _ in $(seq 1 360); do
  curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/health/live" >/dev/null 2>&1 && break
  kill -0 "$api_pid" 2>/dev/null || { wait "$api_pid"; exit $?; }
  sleep 0.25
done
curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/health/live" >/dev/null
curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/auth/providers" >/dev/null
curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/auth/csrf" >/dev/null
node scripts/runtime-proxy.mjs & proxy_pid=$!
wait "$api_pid" "$proxy_pid"
