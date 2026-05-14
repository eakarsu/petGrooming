/**
 * Shared AI utilities for petGrooming.
 *
 * - parseAIJson: 3-strategy resilient JSON parser (raw → strip fences → first {..})
 * - aiRateLimiter: per-user in-memory sliding-window limiter (default 20/hr)
 * - logAIUsage: persists ai_results JSONB rows into AIUsageLog
 * - extractAIError: surfaces real OpenRouter / model errors instead of generic 500s
 */

import { db } from './db'

// ============= JSON Parser =============
export function parseAIJson<T = unknown>(text: string): T | null {
  if (!text) return null
  // Strategy 1: direct parse
  try {
    return JSON.parse(text) as T
  } catch {}

  // Strategy 2: strip code fences
  try {
    const stripped = text.replace(/```(?:json)?\n?/gi, '').replace(/```/g, '').trim()
    return JSON.parse(stripped) as T
  } catch {}

  // Strategy 3: first { ... last }
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1)) as T
    } catch {}
  }
  return null
}

// ============= Rate Limiter =============
type Bucket = { hits: number[]; tokens: number }
const buckets = new Map<string, Bucket>()

const DEFAULT_LIMIT = parseInt(process.env.AI_RATE_LIMIT_PER_HOUR || '20', 10)
const WINDOW_MS = 60 * 60 * 1000

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: Date
  limit: number
}

export function aiRateLimiter(userId: string, limit = DEFAULT_LIMIT): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(userId) || { hits: [], tokens: 0 }
  bucket.hits = bucket.hits.filter((t) => now - t < WINDOW_MS)

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0]
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(oldest + WINDOW_MS),
      limit,
    }
  }

  bucket.hits.push(now)
  buckets.set(userId, bucket)

  return {
    allowed: true,
    remaining: limit - bucket.hits.length,
    resetAt: new Date(now + WINDOW_MS),
    limit,
  }
}

// ============= Error extraction =============
export function extractAIError(error: unknown): { message: string; code?: string } {
  if (error instanceof Error) {
    return { message: error.message }
  }
  if (typeof error === 'object' && error !== null) {
    const obj = error as Record<string, unknown>
    return {
      message: String(obj.message || obj.error || 'AI request failed'),
      code: obj.code as string | undefined,
    }
  }
  return { message: String(error) || 'Unknown AI error' }
}

// ============= AI Usage Logging =============
export interface AIUsagePayload {
  userId?: string
  feature: string
  model?: string
  input?: unknown
  output?: unknown
  error?: string
  durationMs?: number
  tokensIn?: number
  tokensOut?: number
  costUsd?: number
}

export async function logAIUsage(payload: AIUsagePayload): Promise<void> {
  try {
    // Use BusinessSettings.id storage for persistence; fall back to console.
    // We persist via a generic AI usage log if model is available; otherwise no-op.
    // Caller may pass the data; we attempt insertion via raw SQL (best-effort).
    await db.$executeRawUnsafe(
      `INSERT INTO "AIUsageLog" ("id","userId","feature","model","input","output","error","durationMs","tokensIn","tokensOut","costUsd","createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4::jsonb, $5::jsonb, $6, $7, $8, $9, $10, NOW())`,
      payload.userId ?? null,
      payload.feature,
      payload.model ?? null,
      JSON.stringify(payload.input ?? null),
      JSON.stringify(payload.output ?? null),
      payload.error ?? null,
      payload.durationMs ?? null,
      payload.tokensIn ?? null,
      payload.tokensOut ?? null,
      payload.costUsd ?? null,
    )
  } catch {
    // Table may not exist yet; non-fatal.
  }
}

/**
 * Build a standardized JSON error response from an unknown thrown error
 * with the underlying message preserved (no more generic 500s).
 */
export function aiErrorResponse(error: unknown, fallback = 'AI request failed') {
  const { message } = extractAIError(error)
  return { error: message || fallback }
}
