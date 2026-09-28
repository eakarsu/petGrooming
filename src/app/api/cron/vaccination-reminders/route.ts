import { NextRequest, NextResponse } from 'next/server'
import { checkUpcomingVaccinations } from '@/lib/scheduler'

/**
 * GET /api/cron/vaccination-reminders
 *
 * Trigger this route from a cron service (Vercel Cron, GitHub Actions, etc.).
 * Protect it with a shared secret via the CRON_SECRET environment variable.
 * This is a machine endpoint: it does not require a staff session, only the secret.
 *
 * Example vercel.json entry:
 * {
 *   "crons": [{ "path": "/api/cron/vaccination-reminders", "schedule": "0 8 * * *" }]
 * }
 */
export function authorizeCronRequest(request: NextRequest): NextResponse | null {
  const secret = request.headers.get('x-cron-secret')
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret) return NextResponse.json({ error: 'Cron is not configured' }, { status: 503 })
  if (secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

export async function GET(request: NextRequest) {
  const denied = authorizeCronRequest(request)
  if (denied) return denied

  try {
    const daysAheadParam = request.nextUrl.searchParams.get('daysAhead')
    const daysAhead = daysAheadParam ? parseInt(daysAheadParam, 10) : 7

    const result = await checkUpcomingVaccinations(daysAhead)

    return NextResponse.json({
      success: true,
      ...result,
      message: `Checked ${result.checked} vaccination records, delivered ${result.reminded} reminders (${result.emailSent} email, ${result.smsSent} SMS), ${result.failed} failed`,
    })
  } catch (error) {
    console.error('Vaccination reminder cron error:', error)
    return NextResponse.json(
      { error: 'Failed to process vaccination reminders' },
      { status: 500 }
    )
  }
}
