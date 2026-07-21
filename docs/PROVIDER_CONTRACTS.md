# Provider contracts

Every connector endpoint must use HTTPS on port 443, have no embedded credentials, match its configured hostname exactly, and resolve only to public addresses. Requests include bearer authorization and an `Idempotency-Key`; redirects are rejected, calls time out after 10 seconds, and responses over 64 KiB fail closed.

Providers receive `{ operationType, payload }` and return `{ "receipt": "provider-receipt", "output": { ... } }`.

- `ROUTE_QUOTE` returns nonnegative `distanceKm`; quotes exceeding the technician travel limit fail.
- `TAX_QUOTE` and `TAX_INVOICE` return nonnegative integer `taxCents`.
- calendar operations upsert, reschedule, reassign, or cancel the persisted order using the supplied idempotency key.
- messaging operations deliver the named transactional template; marketing messages are outside this workflow.
- `PAYMENT_CHARGE` and `PAYMENT_REFUND` return `externalId`. Money remains pending until a signed webhook confirms success or failure.
- accounting operations post payment/refund facts after confirmed webhooks.

Payment webhooks send `X-Provider-Timestamp`, `X-Provider-Event-Id`, and hex `X-Provider-Signature = HMAC_SHA256(secret, timestamp + "." + rawBody)`. Timestamps outside five minutes, modified bodies, duplicate events, unknown external IDs, and unsupported events fail closed or are idempotently ignored as appropriate.
