import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import type { ProviderConnector, ProviderKind } from '@prisma/client'
import { WorkflowError } from '../src/lib/workflow/errors'
import { invokeSandboxAdapter, normalizeStripeTestEvent, verifyStripeWebhookSignature } from '../src/lib/workflow/sandboxAdapters'

function connector(kind: ProviderKind, provider: string, endpoint: string, credentialEnv: string): ProviderConnector {
  return { kind, provider, endpoint, allowedHost: new URL(endpoint).hostname, credentialEnv } as ProviderConnector
}

const stripePayment = connector('PAYMENT', 'stripe-test', 'https://api.stripe.com', 'STRIPE_TEST_SECRET_KEY')
const stripeTax = connector('TAX', 'stripe-test', 'https://api.stripe.com', 'STRIPE_TEST_SECRET_KEY')
const googleMaps = connector('MAPS', 'google-routes', 'https://routes.googleapis.com/directions/v2:computeRoutes', 'GOOGLE_ROUTES_API_KEY')
const stripeEnv = { NODE_ENV: 'test' as const, STRIPE_TEST_SECRET_KEY: 'sk_test_fixture', STRIPE_TEST_RETURN_URL: 'https://grooming.example.test/operations', STRIPE_GROOMING_TAX_CODE: 'txcd_20030000' }

test('Stripe test Checkout sends exact cents, workflow reference, and idempotency, and returns only a test URL', async () => {
  let called = 0
  const fetcher = (async (url: string, options: RequestInit) => {
    called++
    assert.equal(url, 'https://api.stripe.com/v1/checkout/sessions')
    assert.equal(options.method, 'POST')
    assert.equal((options.headers as Record<string, string>)['idempotency-key'], 'provider:payment-once')
    assert.equal((options.headers as Record<string, string>).authorization, 'Bearer sk_test_fixture')
    const form = new URLSearchParams(String(options.body))
    assert.equal(form.get('line_items[0][price_data][unit_amount]'), '7560')
    assert.equal(form.get('line_items[0][price_data][currency]'), 'usd')
    assert.equal(form.get('client_reference_id'), 'payment-1')
    assert.equal(form.get('metadata[workflowPaymentId]'), 'payment-1')
    assert.match(String(form.get('success_url')), /^https:\/\/grooming\.example\.test\/operations\?checkout=returned$/)
    return Response.json({ object: 'checkout.session', livemode: false, id: 'cs_test_abc123', url: 'https://checkout.stripe.com/c/pay/cs_test_abc123', amount_total: 7560, currency: 'usd', status: 'open' })
  }) as typeof fetch
  const result = await invokeSandboxAdapter(stripePayment, 'PAYMENT_CHARGE', { paymentId: 'payment-1', invoiceId: 'invoice-1', amountCents: 7560, currency: 'USD' }, 'provider:payment-once', stripeEnv, fetcher)
  assert.equal(called, 1)
  assert.equal(result?.receipt, 'cs_test_abc123')
  assert.equal(result?.output.checkoutUrl, 'https://checkout.stripe.com/c/pay/cs_test_abc123')
  await assert.rejects(invokeSandboxAdapter(stripePayment, 'PAYMENT_CHARGE', { paymentId: 'payment-1', invoiceId: 'invoice-1', amountCents: 7560, currency: 'USD' }, 'retry', { ...stripeEnv, STRIPE_TEST_SECRET_KEY: 'sk_live_forbidden' }, fetcher), (error: unknown) => error instanceof WorkflowError && error.code === 'STRIPE_TEST_KEY_REQUIRED')
  assert.equal(called, 1)
})

test('Stripe test Tax validates jurisdiction input and reconciles quoted cents', async () => {
  const fetcher = (async (url: string, options: RequestInit) => {
    assert.equal(url, 'https://api.stripe.com/v1/tax/calculations')
    const form = new URLSearchParams(String(options.body))
    assert.equal(form.get('line_items[0][amount]'), '6000')
    assert.equal(form.get('line_items[0][tax_code]'), 'txcd_20030000')
    assert.equal(form.get('customer_details[address][postal_code]'), '12207')
    return Response.json({ object: 'tax.calculation', livemode: false, id: 'taxcalc_abc', amount_total: 6480, tax_amount_exclusive: 480, currency: 'usd' })
  }) as typeof fetch
  const result = await invokeSandboxAdapter(stripeTax, 'TAX_QUOTE', { amountCents: 6000, currency: 'USD', postalCode: '12207' }, 'quote:tax', stripeEnv, fetcher)
  assert.equal(result?.output.taxCents, 480)
  await assert.rejects(invokeSandboxAdapter(stripeTax, 'TAX_QUOTE', { amountCents: 6000, currency: 'USD', postalCode: 'ABC' }, 'quote:tax', stripeEnv, fetcher), (error: unknown) => error instanceof WorkflowError && error.code === 'PROVIDER_PAYLOAD_INVALID')
  const mismatch = (async () => Response.json({ object: 'tax.calculation', livemode: false, id: 'taxcalc_abc', amount_total: 9999, tax_amount_exclusive: 480, currency: 'usd' })) as typeof fetch
  await assert.rejects(invokeSandboxAdapter(stripeTax, 'TAX_INVOICE', { amountCents: 6000, currency: 'USD', postalCode: '12207' }, 'invoice:tax', stripeEnv, mismatch), (error: unknown) => error instanceof WorkflowError && error.code === 'PROVIDER_RESPONSE_INVALID')
})

test('Google Routes uses configured key, precise points, field mask, and a locally labeled digest', async () => {
  const fetcher = (async (url: string, options: RequestInit) => {
    assert.equal(url, googleMaps.endpoint)
    assert.equal((options.headers as Record<string, string>)['x-goog-api-key'], 'routes-fixture')
    assert.equal((options.headers as Record<string, string>)['x-goog-fieldmask'], 'routes.distanceMeters,routes.duration')
    const body = JSON.parse(String(options.body))
    assert.deepEqual(body.origin.location.latLng, { latitude: 42.65, longitude: -73.75 })
    assert.deepEqual(body.destination.location.latLng, { latitude: 42.66, longitude: -73.76 })
    return Response.json({ routes: [{ distanceMeters: 8250, duration: '900s' }] })
  }) as typeof fetch
  const result = await invokeSandboxAdapter(googleMaps, 'ROUTE_QUOTE', { origin: { latitude: 42.65, longitude: -73.75 }, destination: { latitude: 42.66, longitude: -73.76 } }, 'quote:maps', { NODE_ENV: 'test', GOOGLE_ROUTES_API_KEY: 'routes-fixture' }, fetcher)
  assert.equal(result?.output.distanceKm, 8.25)
  assert.match(String(result?.receipt), /^local-route-response-sha256:[a-f0-9]{64}$/)
})

test('Stripe refund retrieves the paid test session and sends a named, idempotent partial refund', async () => {
  let calls = 0
  const fetcher = (async (url: string, options: RequestInit) => {
    calls++
    if (calls === 1) {
      assert.equal(url, 'https://api.stripe.com/v1/checkout/sessions/cs_test_abc123')
      assert.equal(options.method, 'GET')
      return Response.json({ object: 'checkout.session', livemode: false, id: 'cs_test_abc123', payment_status: 'paid', payment_intent: 'pi_test_abc' })
    }
    assert.equal(url, 'https://api.stripe.com/v1/refunds')
    assert.equal((options.headers as Record<string, string>)['idempotency-key'], 'provider:refund-once')
    const form = new URLSearchParams(String(options.body))
    assert.equal(form.get('payment_intent'), 'pi_test_abc')
    assert.equal(form.get('amount'), '2000')
    assert.equal(form.get('metadata[workflowRefundId]'), 'refund-1')
    return Response.json({ object: 'refund', livemode: false, id: 're_test_abc', amount: 2000, currency: 'usd', payment_intent: 'pi_test_abc', status: 'pending' })
  }) as typeof fetch
  const result = await invokeSandboxAdapter(stripePayment, 'PAYMENT_REFUND', { refundId: 'refund-1', paymentExternalId: 'cs_test_abc123', amountCents: 2000, currency: 'USD' }, 'provider:refund-once', stripeEnv, fetcher)
  assert.equal(calls, 2)
  assert.equal(result?.output.status, 'pending')
  assert.equal(result?.receipt, 're_test_abc')
})

test('Stripe signed events reject tampering and live mode, and normalize terminal payment/refund evidence', () => {
  const now = Date.now(), timestamp = Math.floor(now / 1000), secret = 'whsec_fixture'
  const event = { id: 'evt_test_1', object: 'event', livemode: false, type: 'checkout.session.completed', data: { object: { id: 'cs_test_abc', object: 'checkout.session', livemode: false, client_reference_id: 'payment-1', payment_status: 'paid', amount_total: 7560, currency: 'usd' } } }
  const raw = JSON.stringify(event)
  const signature = createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex')
  assert.equal(verifyStripeWebhookSignature(secret, raw, `t=${timestamp},v1=${signature}`, now), true)
  assert.equal(verifyStripeWebhookSignature(secret, raw + ' ', `t=${timestamp},v1=${signature}`, now), false)
  assert.equal(verifyStripeWebhookSignature(secret, raw, `t=${timestamp - 600},v1=${signature}`, now), false)
  assert.deepEqual(normalizeStripeTestEvent(event), { externalEventId: 'evt_test_1', payload: { type: 'PAYMENT_SUCCEEDED', externalId: 'cs_test_abc', paymentId: 'payment-1', amountCents: 7560, currency: 'usd', failureCode: 'checkout.session.completed' } })
  assert.equal(normalizeStripeTestEvent({ ...event, type: 'checkout.session.completed', data: { object: { ...event.data.object, payment_status: 'unpaid' } } }), null)
  assert.deepEqual(normalizeStripeTestEvent({ ...event, type: 'refund.updated', data: { object: { id: 're_test_abc', object: 'refund', livemode: false, amount: 2000, currency: 'usd', status: 'succeeded', metadata: { workflowRefundId: 'refund-1' } } } }), { externalEventId: 'evt_test_1', payload: { type: 'REFUND_SUCCEEDED', externalId: 're_test_abc', refundId: 'refund-1', amountCents: 2000, currency: 'usd' } })
  assert.throws(() => normalizeStripeTestEvent({ ...event, livemode: true }), (error: unknown) => error instanceof WorkflowError && error.code === 'WEBHOOK_PAYLOAD_INVALID')
})
