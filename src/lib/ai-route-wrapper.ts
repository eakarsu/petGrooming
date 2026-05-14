import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { aiRateLimiter, aiErrorResponse, logAIUsage } from './ai-helpers'

export interface AIRouteContext {
  userId: string
  email: string
}

/**
 * Wraps an AI endpoint handler with:
 *  - next-auth session check (401 if missing)
 *  - per-user sliding-window rate limit (429 if exceeded)
 *  - real-error surfacing instead of generic 500
 *  - AIUsageLog persistence (best-effort)
 *
 * Usage:
 *   export const POST = withAI('breed-identify', async (req, ctx, body) => {
 *     return await identifyBreed(body.image)
 *   })
 */
export function withAI<TBody = Record<string, unknown>, TOutput = unknown>(
  feature: string,
  handler: (req: NextRequest, ctx: AIRouteContext, body: TBody) => Promise<TOutput>,
) {
  return async function POST(req: NextRequest) {
    const start = Date.now()
    let body: TBody | null = null
    let userId = 'anonymous'
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      userId = (session.user as { id?: string }).id || session.user.email || 'anonymous'

      const limit = aiRateLimiter(userId)
      if (!limit.allowed) {
        return NextResponse.json(
          {
            error: `Rate limit exceeded for AI requests. Resets at ${limit.resetAt.toISOString()}.`,
            limit: limit.limit,
            remaining: 0,
            resetAt: limit.resetAt.toISOString(),
          },
          { status: 429 },
        )
      }

      try {
        body = (await req.json()) as TBody
      } catch {
        body = {} as TBody
      }

      const result = await handler(req, { userId, email: session.user.email || '' }, body as TBody)

      await logAIUsage({
        userId,
        feature,
        input: body,
        output: result,
        durationMs: Date.now() - start,
      })

      return NextResponse.json({
        ...(typeof result === 'object' && result !== null ? (result as Record<string, unknown>) : { result }),
        _meta: {
          rateLimit: { limit: limit.limit, remaining: limit.remaining, resetAt: limit.resetAt.toISOString() },
        },
      })
    } catch (error) {
      await logAIUsage({
        userId,
        feature,
        input: body,
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - start,
      })
      return NextResponse.json(aiErrorResponse(error, `${feature} failed`), { status: 500 })
    }
  }
}
