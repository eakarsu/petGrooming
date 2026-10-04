import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import type { ProviderConnector } from '@prisma/client'
import { WorkflowError } from './errors'
import type { ProviderOutput } from './provider'

type Fetcher = typeof fetch
type Data = Record<string, unknown>

function record(value: unknown): Data {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new WorkflowError('PROVIDER_RESPONSE_INVALID', 'Provider returned an invalid object', 502)
  return value as Data
}

function positive(value: unknown, field: string) {
  const number = Number(value)
  if (!Number.isSafeInteger(number) || number < 1) throw new WorkflowError('PROVIDER_PAYLOAD_INVALID', `${field} must be a positive integer`, 422)
  return number
}

function text(value: unknown, field: string) {
  const result = String(value || '').trim()
  if (!result) throw new WorkflowError('PROVIDER_PAYLOAD_INVALID', `${field} is required`, 422)
  return result
}

function requireStripeTest(connector: ProviderConnector, env: NodeJS.ProcessEnv) {
  if (connector.endpoint !== 'https://api.stripe.com' && connector.endpoint !== 'https://api.stripe.com/') throw new WorkflowError('PROVIDER_URL_FORBIDDEN', 'Stripe test connector must use api.stripe.com', 422)
  const key = env[connector.credentialEnv]
  if (!key?.startsWith('sk_test_')) throw new WorkflowError('STRIPE_TEST_KEY_REQUIRED', 'A Stripe test-mode secret key is required', 503)
  return key
}

async function responseJson(response: Response) {
  const declared = Number(response.headers?.get('content-length') || 0)
  if (declared > 65536) throw new WorkflowError('PROVIDER_RESPONSE_TOO_LARGE', 'Provider response exceeded 64 KiB', 502)
  const raw = await response.text()
  if (Buffer.byteLength(raw) > 65536) throw new WorkflowError('PROVIDER_RESPONSE_TOO_LARGE', 'Provider response exceeded 64 KiB', 502)
  if (!response.ok) throw new WorkflowError('PROVIDER_REQUEST_FAILED', `Provider returned ${response.status}`, 502, response.status === 408 || response.status === 429 || response.status >= 500)
  try { return record(JSON.parse(raw)) } catch (error) {
    if (error instanceof WorkflowError) throw error
    throw new WorkflowError('PROVIDER_RESPONSE_INVALID', 'Provider response was not valid JSON', 502)
  }
}

async function stripeRequest(path: string, key: string, idempotencyKey: string | null, form: URLSearchParams | null, fetcher: Fetcher) {
  const response = await fetcher(`https://api.stripe.com${path}`, {
    method: form ? 'POST' : 'GET', redirect: 'error', signal: AbortSignal.timeout(10_000),
    headers: { authorization: `Bearer ${key}`, ...(form ? { 'content-type': 'application/x-www-form-urlencoded', 'idempotency-key': idempotencyKey || '' } : {}) },
    body: form?.toString(),
  })
  return responseJson(response)
}

function testObject(data: Data, expected: string, prefix: string) {
  if (data.object !== expected || data.livemode !== false || typeof data.id !== 'string' || !data.id.startsWith(prefix)) {
    throw new WorkflowError('PROVIDER_RESPONSE_INVALID', 'Stripe response was not a matching test-mode object', 502)
  }
  return String(data.id)
}

function usdCurrency(value: unknown) {
  if (String(value || '').toUpperCase() !== 'USD') throw new WorkflowError('PROVIDER_PAYLOAD_INVALID', 'This sandbox journey supports USD only', 422)
  return 'usd'
}

function returnUrl(env: NodeJS.ProcessEnv, state: string) {
  let url: URL
  try { url = new URL(String(env.STRIPE_TEST_RETURN_URL || '')) } catch { throw new WorkflowError('STRIPE_RETURN_URL_REQUIRED', 'Set a reviewed HTTPS Stripe test return URL', 503) }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash) throw new WorkflowError('STRIPE_RETURN_URL_REQUIRED', 'Stripe test return URL must be HTTPS', 503)
  url.searchParams.set('checkout', state)
  return url.href
}

async function stripeCharge(connector: ProviderConnector, payload: Data, key: string, idempotencyKey: string, env: NodeJS.ProcessEnv, fetcher: Fetcher): Promise<ProviderOutput> {
  const amount = positive(payload.amountCents, 'amountCents')
  const paymentId = text(payload.paymentId, 'paymentId')
  const invoiceId = text(payload.invoiceId, 'invoiceId')
  const form = new URLSearchParams({
    mode: 'payment', 'payment_method_types[0]': 'card',
    'line_items[0][price_data][currency]': usdCurrency(payload.currency),
    'line_items[0][price_data][product_data][name]': `Mobile grooming invoice ${invoiceId}`,
    'line_items[0][price_data][unit_amount]': String(amount), 'line_items[0][quantity]': '1',
    client_reference_id: paymentId, 'metadata[workflowPaymentId]': paymentId,
    success_url: returnUrl(env, 'returned'), cancel_url: returnUrl(env, 'cancelled'),
  })
  const data = await stripeRequest('/v1/checkout/sessions', key, idempotencyKey, form, fetcher)
  const id = testObject(data, 'checkout.session', 'cs_test_')
  let checkoutUrl: URL
  try { checkoutUrl = new URL(String(data.url || '')) } catch { throw new WorkflowError('PROVIDER_RESPONSE_INVALID', 'Stripe Checkout URL was missing', 502) }
  if (checkoutUrl.protocol !== 'https:' || checkoutUrl.hostname !== 'checkout.stripe.com' || data.amount_total !== amount || String(data.currency).toLowerCase() !== 'usd') {
    throw new WorkflowError('PROVIDER_RESPONSE_INVALID', 'Stripe Checkout amount, currency, or URL did not match', 502)
  }
  return { receipt: id, output: { externalId: id, checkoutUrl: checkoutUrl.href, amountCents: amount, status: String(data.status || 'open') } }
}

async function stripeRefund(payload: Data, key: string, idempotencyKey: string, fetcher: Fetcher): Promise<ProviderOutput> {
  const sessionId = text(payload.paymentExternalId, 'paymentExternalId')
  if (!/^cs_test_[A-Za-z0-9]+$/.test(sessionId)) throw new WorkflowError('PROVIDER_PAYLOAD_INVALID', 'A Stripe test Checkout session ID is required', 422)
  const amount = positive(payload.amountCents, 'amountCents')
  usdCurrency(payload.currency)
  const session = await stripeRequest(`/v1/checkout/sessions/${sessionId}`, key, null, null, fetcher)
  testObject(session, 'checkout.session', 'cs_test_')
  if (session.id !== sessionId || session.payment_status !== 'paid' || typeof session.payment_intent !== 'string' || !session.payment_intent.startsWith('pi_')) {
    throw new WorkflowError('PAYMENT_NOT_RECONCILED', 'Stripe Checkout payment is not confirmed as paid', 409)
  }
  const form = new URLSearchParams({ payment_intent: session.payment_intent, amount: String(amount), 'metadata[workflowRefundId]': text(payload.refundId, 'refundId') })
  const refund = await stripeRequest('/v1/refunds', key, idempotencyKey, form, fetcher)
  const id = testObject(refund, 'refund', 're_')
  if (refund.amount !== amount || String(refund.currency).toLowerCase() !== 'usd' || refund.payment_intent !== session.payment_intent) {
    throw new WorkflowError('PROVIDER_RESPONSE_INVALID', 'Stripe refund amount, currency, or payment did not match', 502)
  }
  return { receipt: id, output: { externalId: id, status: String(refund.status || 'pending'), amountCents: amount } }
}

async function stripeTax(payload: Data, key: string, idempotencyKey: string, env: NodeJS.ProcessEnv, fetcher: Fetcher): Promise<ProviderOutput> {
  const amount = positive(payload.amountCents, 'amountCents')
  const postalCode = text(payload.postalCode, 'postalCode')
  if (!/^\d{5}(?:-\d{4})?$/.test(postalCode)) throw new WorkflowError('PROVIDER_PAYLOAD_INVALID', 'Stripe tax sandbox requires a US postal code', 422)
  const taxCode = String(env.STRIPE_GROOMING_TAX_CODE || '')
  if (!/^txcd_[0-9]{8}$/.test(taxCode)) throw new WorkflowError('STRIPE_TAX_CODE_REQUIRED', 'A reviewed Stripe grooming tax code is required', 503)
  const form = new URLSearchParams({
    currency: usdCurrency(payload.currency), 'line_items[0][amount]': String(amount), 'line_items[0][reference]': idempotencyKey,
    'line_items[0][tax_code]': taxCode, 'line_items[0][tax_behavior]': 'exclusive',
    'customer_details[address][country]': 'US', 'customer_details[address][postal_code]': postalCode,
    'customer_details[address_source]': 'billing',
  })
  const calculation = await stripeRequest('/v1/tax/calculations', key, idempotencyKey, form, fetcher)
  const id = testObject(calculation, 'tax.calculation', 'taxcalc_')
  const taxCents = Number(calculation.tax_amount_exclusive)
  if (!Number.isSafeInteger(taxCents) || taxCents < 0 || calculation.amount_total !== amount + taxCents || String(calculation.currency).toLowerCase() !== 'usd') {
    throw new WorkflowError('PROVIDER_RESPONSE_INVALID', 'Stripe Tax calculation did not reconcile to the subtotal', 502)
  }
  return { receipt: id, output: { taxCents, calculationId: id, amountTotalCents: calculation.amount_total } }
}

function coordinates(value: unknown, field: string) {
  const point = record(value)
  const latitude = Number(point.latitude), longitude = Number(point.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    throw new WorkflowError('PROVIDER_PAYLOAD_INVALID', `${field} coordinates are invalid`, 422)
  }
  return { latitude, longitude }
}

async function googleRoute(connector: ProviderConnector, payload: Data, env: NodeJS.ProcessEnv, fetcher: Fetcher): Promise<ProviderOutput> {
  if (connector.endpoint !== 'https://routes.googleapis.com/directions/v2:computeRoutes') throw new WorkflowError('PROVIDER_URL_FORBIDDEN', 'Google Routes connector endpoint is invalid', 422)
  const key = env[connector.credentialEnv]
  if (!key) throw new WorkflowError('PROVIDER_CREDENTIAL_MISSING', 'Google Routes credential is not configured', 503)
  const origin = coordinates(payload.origin, 'origin'), destination = coordinates(payload.destination, 'destination')
  const response = await fetcher(connector.endpoint, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10_000),
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key, 'x-goog-fieldmask': 'routes.distanceMeters,routes.duration' },
    body: JSON.stringify({ origin: { location: { latLng: origin } }, destination: { location: { latLng: destination } }, travelMode: 'DRIVE', routingPreference: 'TRAFFIC_UNAWARE' }),
  })
  const data = await responseJson(response)
  const routes = data.routes
  const first = Array.isArray(routes) ? record(routes[0]) : null
  const meters = Number(first?.distanceMeters)
  if (!Number.isSafeInteger(meters) || meters < 0) throw new WorkflowError('PROVIDER_RESPONSE_INVALID', 'Google Routes distance was invalid', 502)
  const digest = createHash('sha256').update(JSON.stringify({ origin, destination, meters, duration: first?.duration })).digest('hex')
  return { receipt: `local-route-response-sha256:${digest}`, output: { distanceKm: Number(meters) / 1000, distanceMeters: meters, duration: first?.duration || null } }
}

export async function invokeSandboxAdapter(connector: ProviderConnector, operationType: string, payload: unknown, idempotencyKey: string, env: NodeJS.ProcessEnv = process.env, fetcher: Fetcher = fetch): Promise<ProviderOutput | null> {
  if (connector.provider === 'stripe-test' && ['PAYMENT', 'TAX'].includes(connector.kind)) {
    const key = requireStripeTest(connector, env)
    const input = record(payload)
    if (connector.kind === 'PAYMENT' && operationType === 'PAYMENT_CHARGE') return stripeCharge(connector, input, key, idempotencyKey, env, fetcher)
    if (connector.kind === 'PAYMENT' && operationType === 'PAYMENT_REFUND') return stripeRefund(input, key, idempotencyKey, fetcher)
    if (connector.kind === 'TAX' && ['TAX_QUOTE', 'TAX_INVOICE'].includes(operationType)) return stripeTax(input, key, idempotencyKey, env, fetcher)
    throw new WorkflowError('PROVIDER_OPERATION_UNSUPPORTED', 'Stripe test connector does not support this operation', 422)
  }
  if (connector.provider === 'google-routes' && connector.kind === 'MAPS') {
    if (operationType !== 'ROUTE_QUOTE') throw new WorkflowError('PROVIDER_OPERATION_UNSUPPORTED', 'Google Routes connector does not support this operation', 422)
    return googleRoute(connector, record(payload), env, fetcher)
  }
  return null
}

export function verifyStripeWebhookSignature(secret: string, rawBody: string, header: string, now = Date.now()) {
  if (!secret.startsWith('whsec_')) return false
  const fields = header.split(',').map(part => part.trim().split('='))
  const timestamps = fields.filter(([kind]) => kind === 't').map(([, value]) => value)
  const signatures = fields.filter(([kind]) => kind === 'v1').map(([, value]) => value).filter(value => /^[a-f0-9]{64}$/i.test(value || ''))
  if (timestamps.length !== 1 || !signatures.length) return false
  const timestamp = Number(timestamps[0])
  if (!Number.isSafeInteger(timestamp) || Math.abs(now - timestamp * 1000) > 300_000) return false
  const expected = Buffer.from(createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex'), 'hex')
  return signatures.some(signature => {
    const actual = Buffer.from(signature, 'hex')
    return actual.length === expected.length && timingSafeEqual(actual, expected)
  })
}

export function normalizeStripeTestEvent(event: unknown) {
  const value = record(event)
  if (value.object !== 'event' || value.livemode !== false || typeof value.id !== 'string' || !value.id.startsWith('evt_')) throw new WorkflowError('WEBHOOK_PAYLOAD_INVALID', 'A Stripe test event is required', 422)
  const object = record(record(value.data).object)
  const type = String(value.type || '')
  if (object.livemode !== false || typeof object.id !== 'string') throw new WorkflowError('WEBHOOK_PAYLOAD_INVALID', 'Stripe test event object is invalid', 422)
  if (['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired'].includes(type)) {
    if (object.object !== 'checkout.session' || !object.id.startsWith('cs_test_')) throw new WorkflowError('WEBHOOK_PAYLOAD_INVALID', 'Checkout event has wrong object', 422)
    if (type === 'checkout.session.completed' && object.payment_status !== 'paid') return null
    const succeeded = ['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(type)
    if (succeeded && (!Number.isSafeInteger(object.amount_total) || Number(object.amount_total) < 1 || String(object.currency).toLowerCase() !== 'usd')) throw new WorkflowError('WEBHOOK_PAYLOAD_INVALID', 'Checkout amount or currency is invalid', 422)
    return { externalEventId: value.id, payload: { type: succeeded ? 'PAYMENT_SUCCEEDED' : 'PAYMENT_FAILED', externalId: object.id, paymentId: object.client_reference_id, ...(Number.isSafeInteger(object.amount_total) ? { amountCents: object.amount_total } : {}), ...(typeof object.currency === 'string' ? { currency: object.currency } : {}), failureCode: type } }
  }
  if (['refund.created', 'refund.updated', 'refund.failed'].includes(type)) {
    if (object.object !== 'refund' || !object.id.startsWith('re_')) throw new WorkflowError('WEBHOOK_PAYLOAD_INVALID', 'Refund event has wrong object', 422)
    if (object.status !== 'succeeded' && object.status !== 'failed') return null
    if (!Number.isSafeInteger(object.amount) || Number(object.amount) < 1 || String(object.currency).toLowerCase() !== 'usd') throw new WorkflowError('WEBHOOK_PAYLOAD_INVALID', 'Refund amount or currency is invalid', 422)
    const metadata = object.metadata && typeof object.metadata === 'object' && !Array.isArray(object.metadata) ? object.metadata as Data : {}
    return { externalEventId: value.id, payload: { type: object.status === 'succeeded' ? 'REFUND_SUCCEEDED' : 'REFUND_FAILED', externalId: object.id, refundId: metadata.workflowRefundId, amountCents: object.amount, currency: object.currency } }
  }
  return null
}
