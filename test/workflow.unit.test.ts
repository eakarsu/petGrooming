import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import test from 'node:test'
import { sha256, stableJson } from '../src/lib/workflow/hash'
import { validateProviderEndpoint, verifyWebhookSignature } from '../src/lib/workflow/provider'

test('canonical workflow hashes ignore object key insertion order', () => {
  assert.equal(stableJson({ b: 2, a: { d: 4, c: 3 } }), stableJson({ a: { c: 3, d: 4 }, b: 2 }))
  assert.equal(sha256({ b: 2, a: 1 }), sha256({ a: 1, b: 2 }))
})

test('provider endpoints reject insecure, credentialed, and private destinations', async () => {
  await assert.rejects(validateProviderEndpoint({ endpoint: 'http://provider.example.test/hook', allowedHost: 'provider.example.test' }))
  await assert.rejects(validateProviderEndpoint({ endpoint: 'https://user:pass@provider.example.test/hook', allowedHost: 'provider.example.test' }))
  await assert.rejects(validateProviderEndpoint({ endpoint: 'https://127.0.0.1/hook', allowedHost: '127.0.0.1' }))
  await assert.rejects(validateProviderEndpoint({ endpoint: 'https://provider.example.test:8443/hook', allowedHost: 'provider.example.test' }))
})

test('webhook verification binds timestamp and exact raw body', () => {
  const secret = 'test-webhook-secret-with-more-than-32-characters'
  const timestamp = Math.floor(Date.now() / 1000)
  const raw = '{"type":"PAYMENT_SUCCEEDED"}'
  const signature = createHmac('sha256', secret).update(`${timestamp}.${raw}`).digest('hex')
  assert.equal(verifyWebhookSignature(secret, timestamp, raw, signature), true)
  assert.equal(verifyWebhookSignature(secret, timestamp, `${raw} `, signature), false)
  assert.equal(verifyWebhookSignature(secret, timestamp - 600, raw, signature), false)
})
