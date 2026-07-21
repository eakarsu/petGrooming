# Operations

## Release and migration

Build releases from a clean lockfile with `npm ci`, `npm run db:generate`, `npm run check`, `npm test`, and `npm run build`. Back up PostgreSQL before `npm run db:migrate:deploy`. The current readiness migration is `20260720120947_mobile_grooming_workflow`; `/api/health/ready` returns 503 when it is absent or the database is unavailable.

Run the web process and at least one worker process separately. The worker leases rows using `FOR UPDATE SKIP LOCKED`; multiple workers are supported. A connector operation becomes `DEAD_LETTER` after bounded attempts. A manager must investigate the provider receipt/state, correct the cause, and use the authenticated retry endpoint with a reason. Never blindly replay payment operations at a provider without the persisted idempotency key.

## Access and provisioning

The initial admin provisioner refuses to run after any user exists. Administrators configure groomer skills, service areas, availability, inventory requirements, and provider metadata through `/api/workflow/admin/config`. Connector fields contain only HTTPS endpoints, an exact allowed host, and environment-variable names. Rotate a staff session by changing the password or incrementing `User.authVersion`; new workflow APIs revalidate account state and token version on every call.

## Recovery and reconciliation

Field devices submit `deviceId`, `clientCommandId`, and `expectedVersion`. Duplicate commands return the original result. Stale commands persist as conflicts for explicit reconciliation and never overwrite newer work. Payment webhooks require a timestamp, event ID, and HMAC over the exact raw body; event IDs are immutable and unique.

Back up with `npm run backup -- /absolute/path/backup.dump`. Test restoration only into an explicitly created isolated database using `npm run restore -- /absolute/path/backup.dump RESTORE_CONFIRMED`, then verify migration status and representative row counts. Production restore requires a maintenance window, verified target URL, recent backup hash, and application/worker shutdown.

## Alerts

Alert on readiness failure, any dead-letter operation, leased work older than its lease, payment/refund pending beyond provider SLA, inventory constraint failures, webhook signature failures, audit verification failures, and offline conflicts awaiting reconciliation. Logs must contain request/operation IDs but never credentials, webhook secrets, customer message bodies, or payment data.
