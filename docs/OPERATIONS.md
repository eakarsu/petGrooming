# Operations

## Release and migration

Build releases from a clean lockfile with `npm ci`, `npm run db:generate`, `npm run check`, `npm test`, and `npm run build`. Back up PostgreSQL before `npm run db:migrate:deploy`. The current readiness migration is `20260720120947_mobile_grooming_workflow`; `/api/health/ready` returns 503 when it is absent or the database is unavailable.

Run the web process and at least one worker process separately. The worker leases rows using `FOR UPDATE SKIP LOCKED`; multiple workers are supported. A connector operation becomes `DEAD_LETTER` after bounded attempts. A manager must investigate the provider receipt/state, correct the cause, and use the authenticated retry endpoint with a reason. Never blindly replay payment operations at a provider without the persisted idempotency key.

## Access and provisioning

The initial admin provisioner refuses to run after any user exists. Administrators configure groomer skills, service areas, availability, inventory requirements, and provider metadata through `/api/workflow/admin/config`. Connector fields contain only HTTPS endpoints, an exact allowed host, and environment-variable names. Rotate a staff session by changing the password or incrementing `User.authVersion`; new workflow APIs revalidate account state and token version on every call.

## Recovery and reconciliation

Field devices submit `deviceId`, `clientCommandId`, and `expectedVersion`. Duplicate commands return the original result. Stale commands persist as conflicts for explicit reconciliation and never overwrite newer work. Payment webhooks require a timestamp, event ID, and HMAC over the exact raw body; event IDs are immutable and unique.

### Stripe test Checkout, Tax, and Google Routes journey

1. Set `STRIPE_TEST_SECRET_KEY`, `STRIPE_TEST_WEBHOOK_SECRET`, `STRIPE_TEST_RETURN_URL`, `STRIPE_GROOMING_TAX_CODE`, and `GOOGLE_ROUTES_API_KEY` using actual **test** credentials and a reviewed public HTTPS return URL. Select the correct Stripe Tax code for the business and jurisdictions. Keep credentials only in the deployment secret store or ignored `.env`.
2. As an administrator, use `POST /api/workflow/admin/config` with `action: "UPSERT_CONNECTOR"` to create these exact connector records. `serviceUserId` must be an active account ID from the admin config GET response:

   | kind | provider | endpoint | allowedHost | credentialEnv | webhookSecretEnv |
   | --- | --- | --- | --- | --- | --- |
   | `MAPS` | `google-routes` | `https://routes.googleapis.com/directions/v2:computeRoutes` | `routes.googleapis.com` | `GOOGLE_ROUTES_API_KEY` | omitted |
   | `TAX` | `stripe-test` | `https://api.stripe.com` | `api.stripe.com` | `STRIPE_TEST_SECRET_KEY` | omitted |
   | `PAYMENT` | `stripe-test` | `https://api.stripe.com` | `api.stripe.com` | `STRIPE_TEST_SECRET_KEY` | `STRIPE_TEST_WEBHOOK_SECRET` |

3. The `/operations` workbench auto-selects a provider only when exactly one enabled connector exists for that kind. If several are enabled, submit explicit connector IDs through the workflow API. Configure a test webhook in Stripe with destination `https://<public-host>/api/workflow/webhooks/payment/<payment-connector-id>` and subscribe to `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `refund.created`, `refund.updated`, and `refund.failed`. Confirm the admin GET response reports credentials and webhook secret configured; this checks environment presence, not provider reachability.
4. With technician skills, availability, service area, and inventory configured, request a quote. The worker obtains a road distance and a tax estimate before the quote becomes offered. Accept it, complete the visit, issue an invoice, and run the worker. The workbench will then queue an exact amount test Checkout and show its link. Complete it with a Stripe test card. Refresh the workbench after the signed event to see paid status. Enter a partial refund amount and supervisor reason, run the worker, then wait for the signed terminal refund event before treating funds as refunded.
5. For a dead-letter operation, inspect its stored `lastError`, receipt and provider object. Use authenticated `POST /api/workflow/operations/<operation-id>/retry` with a nonempty `reason` only after confirming the original provider object cannot still settle. Stripe money operations older than 23 hours reject replay because the provider idempotency window may have expired. Reconcile with signed provider evidence and inspect any replacement payment before requesting another charge. The workbench exposes payment/refund operation status; it does not itself certify external settlement.

The journey is sandbox-ready based on mocked provider-contract tests and database workflow tests. No live Stripe or Google call was made in this implementation. Production readiness still needs connected test credentials, real webhook delivery, Google billing/key restrictions, reviewed tax registration and codes, provider failure drills, and accounting/messaging connector validation.

Back up with `npm run backup -- /absolute/path/backup.dump`. Test restoration only into an explicitly created isolated database using `npm run restore -- /absolute/path/backup.dump RESTORE_CONFIRMED`, then verify migration status and representative row counts. Production restore requires a maintenance window, verified target URL, recent backup hash, and application/worker shutdown.

## Alerts

Alert on readiness failure, any dead-letter operation, leased work older than its lease, payment/refund pending beyond provider SLA, inventory constraint failures, webhook signature failures, audit verification failures, and offline conflicts awaiting reconciliation. Logs must contain request/operation IDs but never credentials, webhook secrets, customer message bodies, or payment data.
