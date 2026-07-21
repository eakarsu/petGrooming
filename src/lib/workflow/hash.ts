import { createHash } from 'node:crypto'

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    )
  }
  return value instanceof Date ? value.toISOString() : value
}

export function stableJson(value: unknown) {
  return JSON.stringify(canonicalize(value))
}

export function sha256(value: unknown) {
  return createHash('sha256').update(typeof value === 'string' ? value : stableJson(value)).digest('hex')
}

export function requireSha256(value: unknown) {
  const normalized = String(value || '').toLowerCase()
  if (!/^[a-f0-9]{64}$/.test(normalized)) throw new Error('Expected a SHA-256 digest')
  return normalized
}
