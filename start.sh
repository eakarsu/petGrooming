#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -z "${DATABASE_URL:-}" ]]; then echo "DATABASE_URL is required" >&2; exit 1; fi
if [[ -z "${NEXTAUTH_SECRET:-}" || ${#NEXTAUTH_SECRET} -lt 32 ]]; then echo "NEXTAUTH_SECRET must contain at least 32 characters" >&2; exit 1; fi
if [[ -z "${NEXTAUTH_URL:-}" ]]; then echo "NEXTAUTH_URL is required" >&2; exit 1; fi
if [[ -z "${CORS_ALLOWED_ORIGINS:-}" ]]; then echo "CORS_ALLOWED_ORIGINS is required" >&2; exit 1; fi
if [[ ! -f "$project_dir/.next/BUILD_ID" ]]; then echo "Production build is missing; run npm ci, npm run db:generate, and npm run build" >&2; exit 1; fi
if [[ ! -d "$project_dir/node_modules/.prisma/client" ]]; then echo "Prisma client is missing; run npm ci and npm run db:generate" >&2; exit 1; fi

export NODE_ENV=production
cd "$project_dir"
exec npm start -- --hostname "${HOST:-0.0.0.0}"
