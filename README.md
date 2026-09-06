# PetGroom Pro

PetGroom Pro now centers one governed mobile-grooming journey: provider-validated quote, skills/availability check, booking and stock reservation, dispatch, rescheduling or reassignment, field status/offline recovery, approved change order, invoice, payment/refund, and cancellation or no-show handling.

The governed mobile workflow and new counter checkout calculations use integer cents. Historical counter records retain their original fields and are labeled unverified until reconciled. PostgreSQL constraints protect inventory, time ranges, transition integrity, approval separation, immutable provider receipts, and a hash-chained audit. Maps, calendar, messaging, payment, tax, and accounting calls use a durable leased outbox with idempotency keys, bounded retries, dead-letter repair, and signed/idempotent payment webhooks. No provider credential or document secret is stored in the database.

## Prepared installation

1. Copy `.env.example` to the ignored `.env` and replace the database and authentication placeholders. Keep the database URL quoted so Bash preserves query parameters.
2. Run `npm ci` and `npm run db:generate`.
3. Apply checked-in migrations with `npm run db:migrate:deploy`; repeat the command to verify replay and run `npm run db:migrate:status`.
4. Provision the first administrator once with `PROVISION_ADMIN_EMAIL`, `PROVISION_ADMIN_NAME`, and a 14+ character `PROVISION_ADMIN_PASSWORD`: `npm run provision`.
5. For local development, launch with `./start.sh`. For a prepared production artifact, run `npm run build` and `npm start -- --port 30940` with the production environment. Start `npm run worker` only after configuring and validating the desired provider adapters.

`start.sh` generates the Prisma client, deploys checked-in migrations, provisions a missing administrator while preserving an existing account, optionally loads demo records when explicitly configured, and runs Next.js development mode plus the local proxy. It refuses occupied ports and does not install dependencies or create the PostgreSQL database. `npm run provision` remains an explicit administrator reset operation. AI credentials are optional for startup; AI requests require valid provider configuration. Demo credential autofill requires an explicit local opt-in and is disabled in production.

For local credential autofill, set `ENABLE_DEMO_CREDENTIAL_AUTOFILL=true` in `.env` and restart `./start.sh`. The login button appears only when a configured administrator email and password are available. Its availability check never returns credentials; clicking the button fills them only for localhost requests in development mode. Disabled autofill returns a normal availability response instead of a missing-route error.

See [operations](docs/OPERATIONS.md) and [provider contracts](docs/PROVIDER_CONTRACTS.md).

## Local sample data

After configuring the existing administrator and deploying migrations, run
`npm run demo-data:load` to add fictional sample records to the local database.
`npm run demo-data:verify` also reloads them and verifies that records and the
administrator are unchanged. Records persist across restarts; existing edits are
preserved and deterministic IDs prevent duplicates.

The loader supplies at least 15 examples in each of 40 data tables, including vaccinations, behavior notes, veterinary contacts, incidents, medical records, cancelled prescription and surgery examples, pending lab requests, intake, style preview requests, bundles and unapproved knowledge drafts. Clinical examples are fictional, contain no treatment instructions and are not verified medical evidence. Payment receipts, provider activity, security tokens, audit history and AI execution history are created by their workflows; singleton business settings are configured by an administrator.

To restore missing samples during local startup, set `LOAD_DEMO_DATA=true` in the
ignored `.env`. It defaults to false. The loader refuses production mode and remote
databases. It does not send messages, run AI, charge cards, or manufacture provider
receipts. Demo requests remain pending/draft and demo promotions remain inactive.
Each loader run adds a set of 15 appointments, linked services, pending grooming
sessions and groomer availability for the current local date. Date-specific IDs
prevent duplicate appointments on repeat loads; historical appointments and edits
remain intact. Run the loader again on a later day to populate that day's views.

When running the portfolio locally, include `connection_limit=2&pool_timeout=30`
in the PostgreSQL `DATABASE_URL` query parameters to keep simultaneous apps from
exhausting the shared database connection limit. Restart after changing .env.

## Operational setup and verification

- Sign in again after this update: cookies now use the `petgroom` namespace to avoid collisions with other local apps.
- Save actual business hours, timezone, currency and the reviewed tax rate in **Settings** before booking or counter checkout. A zero tax rate is permitted only when explicitly confirmed; the app does not determine which tax rules apply.
- **Groomer Setup** exposes profiles, qualified services, service areas, availability/time off and provider readiness. Administrators configure profiles; managers can maintain availability. Bookings require an active qualified groomer, covering availability and business hours.
- Counter checkout supports explicitly recorded cash, gift-card or loyalty payment, uses server catalog prices, and journals stock and balances atomically. Card payments remain in the provider-backed mobile workflow. Split tenders and partial counter refunds remain on the feature backlog.
- **Receipts & Refunds** shows the latest 100 counter records, item details, verification status and manager full-refund controls. Cash refunds require recorded handover confirmation. Product restocking is a separate reviewed adjustment. Refunds cannot silently create a negative loyalty balance.
- Gift-card issuance is an explicit manager action with a reason/payment reference. Issuance does not collect payment. Redemptions require a positive amount and reason. Legacy balances were converted to cents in the additive migration, with historical numeric fields retained for compatibility.
- Run `npm run test:unit` for database-free checks. Run `npm run test:isolated` for the full suite: it creates a uniquely named local test database, deploys migrations, runs tests with provider fixtures, and drops that database in a finally block. The configured database role needs create/drop database privileges. Never point the workflow test suite at operational data.
- Run `npm run check` and `npm run build` before release. See [FEATURE_STATUS.md](FEATURE_STATUS.md) for the outstanding product and acceptance backlog.

Run `npm run test:restore` to create a private backup, restore it into a disposable local PostgreSQL database, and read all restored public tables. It requires local PostgreSQL tools and permission to create a temporary database. The backup remains under `~/.codex/backups/<project>/`; the temporary database is removed after the check. The September 6 full restore rehearsal passed.

### AI drafts and business guidance

Open **AI Drafts & Knowledge** after login. Select a pet and approved guidance, review the sharing scope, and generate a saved draft. A draft requires a staff review; approval does not send messages or change operational records. A different active manager must approve saved business guidance. Source changes invalidate draft approval.

Set `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` and canonical `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1` for text drafts. Photo observations additionally require `OPENROUTER_VISION_MODEL` supporting image input. The request uses the provider's documented [chat-completions image content format](https://openrouter.ai/docs/api_reference/overview). Photo storage/sharing requires an owner-consent reference and operator confirmation. Private PNG/JPEG input is limited to 600 KB. Managers can delete retained photos after canceling any active request; audit hashes remain.

Optional `PET_AI_DAILY_LIMIT` (default 50) and `PET_AI_DAILY_REPORTED_COST_USD` (default 10) bound requests and reported usage per UTC day. Reported cost is not a guarantee of final billing. Review unknown provider outcomes before canceling; do not create a replacement request until provider activity is reconciled. `npm run test:isolated` runs fixture-only PostgreSQL checks; no provider keys are needed for tests.
