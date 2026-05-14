import { NextRequest, NextResponse } from 'next/server'
import { checkUpcomingVaccinations } from '@/lib/scheduler'

/**
 * GET /api/cron/vaccination-reminders
 *
 * Trigger this route from a cron service (Vercel Cron, GitHub Actions, etc.).
 * Protect it with a shared secret via the CRON_SECRET environment variable.
 *
 * Example vercel.json entry:
 * {
 *   "crons": [{ "path": "/api/cron/vaccination-reminders", "schedule": "0 8 * * *" }]
 * }
 */
export async function GET(request: NextRequest) {
  // Validate the cron secret to prevent unauthorised triggers
  const secret = request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret')
  const expectedSecret = process.env.CRON_SECRET

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const daysAheadParam = request.nextUrl.searchParams.get('daysAhead')
    const daysAhead = daysAheadParam ? parseInt(daysAheadParam, 10) : 7

    const result = await checkUpcomingVaccinations(daysAhead)

    return NextResponse.json({
      success: true,
      ...result,
      message: `Checked ${result.checked} vaccination records, sent ${result.reminded} reminders`,
    })
  } catch (error) {
    console.error('Vaccination reminder cron error:', error)
    return NextResponse.json(
      { error: 'Failed to process vaccination reminders' },
      { status: 500 }
    )
  }
}
