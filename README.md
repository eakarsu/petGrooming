# PetGroom Pro

PetGroom Pro now centers one governed mobile-grooming journey: provider-validated quote, skills/availability check, booking and stock reservation, dispatch, rescheduling or reassignment, field status/offline recovery, approved change order, invoice, payment/refund, and cancellation or no-show handling.

Money is stored in integer cents. PostgreSQL constraints protect inventory, time ranges, transition integrity, approval separation, immutable provider receipts, and a hash-chained audit. Maps, calendar, messaging, payment, tax, and accounting calls use a durable leased outbox with idempotency keys, bounded retries, dead-letter repair, and signed/idempotent payment webhooks. No provider credential or document secret is stored in the database.

## Prepared installation

1. Copy `.env.example` outside source control and replace every placeholder.
2. Run `npm ci` and `npm run db:generate`.
3. Apply checked-in migrations with `npm run db:migrate:deploy`; repeat the command to verify replay and run `npm run db:migrate:status`.
4. Provision the first administrator once with `PROVISION_ADMIN_EMAIL`, `PROVISION_ADMIN_NAME`, and a 14+ character `PROVISION_ADMIN_PASSWORD`: `npm run provision`.
5. Build using `npm run build`, then launch the prepared artifact with `./start.sh` and the integration worker with `npm run worker`.

`start.sh` never installs packages, creates or migrates a database, seeds data, kills ports, or starts development mode. Public self-registration, demo credentials, reset-token disclosure, generated gap pages, and generic AI product behavior are not part of the reachable application.

See [operations](docs/OPERATIONS.md) and [provider contracts](docs/PROVIDER_CONTRACTS.md).
