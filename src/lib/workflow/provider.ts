import { createHmac, timingSafeEqual } from 'node:crypto'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import type { ProviderConnector } from '@prisma/client'
import { WorkflowError } from './errors'

function isPrivateAddress(address: string) {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number)
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) ||
      (a === 100 && b >= 64 && b <= 127) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224
  }
  const normalized = address.toLowerCase()
  return !/^[23][0-9a-f]{3}:/.test(normalized) || normalized === '::1' || normalized === '::' || normalized.startsWith('fc') ||
    normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9') ||
    normalized.startsWith('fea') || normalized.startsWith('feb')
}

export async function validateProviderEndpoint(connector: Pick<ProviderConnector, 'endpoint' | 'allowedHost'>) {
  let url: URL
  try { url = new URL(connector.endpoint) } catch { throw new WorkflowError('PROVIDER_URL_INVALID', 'Provider endpoint is invalid') }
  if (url.protocol !== 'https:' || url.port || url.username || url.password || url.hostname !== connector.allowedHost) {
    throw new WorkflowError('PROVIDER_URL_FORBIDDEN', 'Provider endpoints require HTTPS, the configured host, standard port, and no embedded credentials')
  }
  const results = await lookup(url.hostname, { all: true, verbatim: true })
  if (results.length === 0 || results.some(({ address }) => isPrivateAddress(address))) {
    throw new WorkflowError('PROVIDER_ADDRESS_FORBIDDEN', 'Provider host resolves to a non-public address')
  }
  return url
}

export type ProviderOutput = { receipt: string; output: Record<string, unknown> }
export type ProviderInvoker = (connector: ProviderConnector, operationType: string, payload: unknown, idempotencyKey: string) => Promise<ProviderOutput>

export const invokeProvider: ProviderInvoker = async (connector, operationType, payload, idempotencyKey) => {
  const url = await validateProviderEndpoint(connector)
  const credential = process.env[connector.credentialEnv]
  if (!credential) throw new WorkflowError('PROVIDER_CREDENTIAL_MISSING', `${connector.kind} provider credential is not configured`, 503, true)
  const response = await fetch(url, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10_000),
    headers: {
      authorization: `Bearer ${credential}`, 'content-type': 'application/json',
      'idempotency-key': idempotencyKey,
    },
    body: JSON.stringify({ operationType, payload }),
  })
  if (!response.ok) throw new WorkflowError('PROVIDER_REQUEST_FAILED', `${connector.kind} provider returned ${response.status}`, 502, response.status === 408 || response.status === 429 || response.status >= 500)
  const reader = response.body?.getReader()
  if (!reader) throw new WorkflowError('PROVIDER_RESPONSE_INVALID', 'Provider response body is empty', 502)
  const chunks: Uint8Array[] = []; let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 64 * 1024) { await reader.cancel(); throw new WorkflowError('PROVIDER_RESPONSE_TOO_LARGE', 'Provider response exceeded 64 KiB', 502) }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = Buffer.concat(chunks)

  let result: unknown
  try { result = JSON.parse(new TextDecoder().decode(bytes)) } catch { throw new WorkflowError('PROVIDER_RESPONSE_INVALID', 'Provider response was not valid JSON', 502) }
  return validateProviderOutput(result)

}

export function validateProviderOutput(result: unknown): ProviderOutput {
  const value = result as Partial<ProviderOutput> | null
  if (!value || typeof value !== 'object' || Array.isArray(value) || typeof value.receipt !== 'string' || !value.receipt.trim() || value.receipt.length > 2048 || !value.output || typeof value.output !== 'object' || Array.isArray(value.output)) {
    throw new WorkflowError('PROVIDER_RESPONSE_INVALID', 'Provider response did not match the connector contract', 502)
  }
  return value as ProviderOutput
}

export function verifyWebhookSignature(secret: string, timestamp: number, rawBody: string, supplied: string) {
  if (!secret || typeof supplied !== 'string' || !/^[a-f0-9]{64}$/i.test(supplied)) return false
  if (!Number.isSafeInteger(timestamp) || Math.abs(Date.now() - timestamp * 1000) > 5 * 60_000) return false
  const expected = Buffer.from(createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex'), 'hex')
  let actual: Buffer
  try { actual = Buffer.from(supplied, 'hex') } catch { return false }
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
