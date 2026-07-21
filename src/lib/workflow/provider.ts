import { createHmac, timingSafeEqual } from 'node:crypto'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import type { ProviderConnector } from '@prisma/client'
import { WorkflowError } from './errors'

function isPrivateAddress(address: string) {
  if (isIP(address) === 4) {
    const [a, b] = address.split('.').map(Number)
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224
  }
  const normalized = address.toLowerCase()
  return normalized === '::1' || normalized === '::' || normalized.startsWith('fc') ||
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
  const bytes = new Uint8Array(await response.arrayBuffer())
  if (bytes.byteLength > 64 * 1024) throw new WorkflowError('PROVIDER_RESPONSE_TOO_LARGE', 'Provider response exceeded 64 KiB', 502)
  let result: unknown
  try { result = JSON.parse(new TextDecoder().decode(bytes)) } catch { throw new WorkflowError('PROVIDER_RESPONSE_INVALID', 'Provider response was not valid JSON', 502) }
  if (!result || typeof result !== 'object' || typeof (result as { receipt?: unknown }).receipt !== 'string' || typeof (result as { output?: unknown }).output !== 'object') {
    throw new WorkflowError('PROVIDER_RESPONSE_INVALID', 'Provider response did not match the connector contract', 502)
  }
  return result as ProviderOutput
}

export function verifyWebhookSignature(secret: string, timestamp: number, rawBody: string, supplied: string) {
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp * 1000) > 5 * 60_000) return false
  const expected = Buffer.from(createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex'), 'hex')
  let actual: Buffer
  try { actual = Buffer.from(supplied, 'hex') } catch { return false }
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
