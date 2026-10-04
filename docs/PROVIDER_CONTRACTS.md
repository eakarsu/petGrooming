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

## Native sandbox adapters

The exact provider name `stripe-test` selects a built-in adapter for `PAYMENT` and `TAX`; its connector endpoint must be `https://api.stripe.com`, allowed host `api.stripe.com`, and credential environment variable must contain a `sk_test_` key. The payment connector also needs a `whsec_` webhook secret. This adapter supports USD and US postal codes only. Set `STRIPE_TEST_RETURN_URL` to a reviewed public HTTPS operations URL and `STRIPE_GROOMING_TAX_CODE` to the reviewed Stripe Tax code for this service. A Tax calculation is an estimate, not registration, filing, or legal tax advice. The calculation response must identify a test-mode `tax.calculation` and reconcile `amount_total = subtotal + tax_amount_exclusive`. See [Stripe Tax calculation object](https://docs.stripe.com/api/tax/calculations/object).

`PAYMENT_CHARGE` creates a Stripe hosted [Checkout Session](https://docs.stripe.com/api/checkout/sessions/create) for the exact invoice amount and stores a `checkout.stripe.com` URL in the operation output. That URL is visible on the operations workbench while payment is pending. Returning from Checkout does not mark the invoice paid. The signed `checkout.session.completed` event with `payment_status=paid`, or `checkout.session.async_payment_succeeded`, does. A matching failed/expired event marks a pending payment failed. The webhook route is `/api/workflow/webhooks/payment/<connectorId>` and verifies Stripe's `Stripe-Signature` against the raw request body. See [Stripe signature verification](https://docs.stripe.com/webhooks/signature).

`PAYMENT_REFUND` retrieves the paid test Checkout Session to obtain its PaymentIntent, then creates an exact amount [Stripe refund](https://docs.stripe.com/api/refunds/create) with the workflow refund ID in metadata. A signed terminal `refund.created` or `refund.updated` event is required to mark the refund succeeded or failed. Both payment and refund events must match the stored amount and USD currency. Duplicate event IDs are idempotent. A valid signed event can reconcile a timed-out operation by its workflow payment/refund ID, including a late success after a local dead letter. The operation receipt is then labeled `webhook:<eventId>`. Stripe's [idempotency retention](https://docs.stripe.com/api/idempotent_requests) is limited; this worker refuses to replay a Stripe money operation after 23 hours from creation. An operator must inspect the provider object and wait for or recover signed evidence, then resolve any overpayment or conflicting event before starting another payment.

A locally failed payment or refund with an unresolved provider operation still reserves its amount. A signed terminal failure completes that operation and releases the reservation. Supervisor retry of a dead letter requires a reconciliation reason; a successful provider retry returns the item to pending until a signed event settles it.

The exact provider name `google-routes` selects the built-in `MAPS` adapter. Its endpoint must be `https://routes.googleapis.com/directions/v2:computeRoutes`, allowed host `routes.googleapis.com`, and configured credential environment variable must contain a Google Routes API key. It sends the technician base coordinates and destination coordinates, requests only distance and duration, and stores distance in kilometers. Its `local-route-response-sha256:*` receipt is a **local digest**, not a Google transaction receipt. Google Routes has no separate mock sandbox here and may incur charges; this implementation was tested with a mock response only. See [Compute Routes](https://developers.google.com/maps/documentation/routes/compute_route_directions) and [field masks](https://developers.google.com/maps/documentation/routes/choose_fields).

All other provider names continue to use the generic `{ operationType, payload }` contract above. Live Stripe keys and live-mode Stripe objects are rejected by `stripe-test`. This does not establish a production payment, tax, maps, accounting, or messaging integration.
