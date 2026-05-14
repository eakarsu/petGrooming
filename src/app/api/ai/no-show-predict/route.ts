import { NextRequest, NextResponse } from 'next/server'
import { withAI } from '@/lib/ai-route-wrapper'
import { db } from '@/lib/db'
import { aiErrorResponse } from '@/lib/ai-helpers'

interface PredictBody {
  appointmentId: string
}

/**
 * Predicts no-show probability based on the client's history.
 * Uses a logistic-like score combining:
 *  - past no-show rate
 *  - days since last visit
 *  - lifetime spend
 *  - lead time before appointment
 *  - hour of day (early/late slots are riskier)
 *
 * Outputs riskScore [0..1], riskTier, and proposed deposit amount.
 */
function logistic(z: number): number {
  return 1 / (1 + Math.exp(-z))
}

export const POST = withAI<PredictBody>('no-show-predict', async (_req, _ctx, body) => {
  if (!body.appointmentId) throw new Error('appointmentId is required')

  const appt = await db.appointment.findUnique({
    where: { id: body.appointmentId },
    include: {
      client: { include: { appointments: true, transactions: true } },
      services: { include: { service: true } },
    },
  })
  if (!appt) throw new Error('Appointment not found')

  const past = appt.client.appointments.filter((a) => a.id !== appt.id)
  const noShows = past.filter((a) => a.status === 'NO_SHOW').length
  const completed = past.filter((a) => a.status === 'COMPLETED').length
  const total = noShows + completed
  const noShowRate = total > 0 ? noShows / total : 0.05

  const lastVisit = past
    .filter((a) => a.status === 'COMPLETED')
    .sort((a, b) => +new Date(b.scheduledDate) - +new Date(a.scheduledDate))[0]
  const daysSinceLast = lastVisit
    ? (Date.now() - +new Date(lastVisit.scheduledDate)) / (1000 * 60 * 60 * 24)
    : 365

  const lifetimeSpend = appt.client.transactions.reduce((sum, t) => sum + (t.total || 0), 0)
  const leadTimeHours = Math.max(0, (+new Date(appt.scheduledDate) - Date.now()) / (1000 * 60 * 60))

  const hour = parseInt(appt.scheduledTime?.split(':')[0] || '12', 10)
  const earlyOrLate = hour < 9 || hour > 17 ? 1 : 0

  // Hand-tuned coefficients (no training data available)
  const z =
    -2.0 + // base
    3.0 * noShowRate +
    0.005 * daysSinceLast +
    -0.0005 * lifetimeSpend +
    -0.01 * Math.min(leadTimeHours, 168) +
    0.4 * earlyOrLate

  const riskScore = Math.max(0, Math.min(1, logistic(z)))
  const riskTier = riskScore >= 0.6 ? 'HIGH' : riskScore >= 0.3 ? 'MEDIUM' : 'LOW'
  const apptValue = appt.services.reduce((s, as) => s + (as.price || 0), 0) || 50
  const depositRequired = riskTier === 'HIGH'
  const depositAmount = depositRequired ? Math.round(apptValue * 0.5 * 100) / 100 : null

  const features = {
    noShowRate,
    daysSinceLast,
    lifetimeSpend,
    leadTimeHours,
    earlyOrLate,
    apptValue,
    pastTotal: total,
  }

  const prediction = await db.noShowPrediction.upsert({
    where: { appointmentId: appt.id },
    create: {
      appointmentId: appt.id,
      riskScore,
      riskTier,
      features: features as object,
      depositRequired,
      depositAmount: depositAmount ?? undefined,
    },
    update: {
      riskScore,
      riskTier,
      features: features as object,
      depositRequired,
      depositAmount: depositAmount ?? undefined,
    },
  })

  return {
    appointmentId: appt.id,
    riskScore,
    riskTier,
    depositRequired,
    depositAmount,
    features,
    predictionId: prediction.id,
  }
})

/** GET high-risk upcoming appointments for the dashboard */
export async function GET() {
  try {
    const items = await db.noShowPrediction.findMany({
      where: { riskTier: 'HIGH' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ data: items })
  } catch (error) {
    return NextResponse.json(aiErrorResponse(error, 'Failed to load predictions'), { status: 500 })
  }
}
