import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * Per-tenant AI settings (model selection, optional per-tenant API key,
 * monthly budget cap). Used by openrouter.ts to pull tenant overrides.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await db.tenantAISettings.findUnique({ where: { tenantId: 'default' } })
  return NextResponse.json(
    settings || {
      tenantId: 'default',
      openrouterModel: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
      visionModel: process.env.OPENROUTER_VISION_MODEL || 'anthropic/claude-3-haiku',
      monthlyBudgetUsd: null,
      alertThresholdPct: 80,
      hardCapEnabled: false,
    },
  )
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const role = (session.user as { role?: string }).role
  if (role !== 'ADMIN' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const updated = await db.tenantAISettings.upsert({
    where: { tenantId: 'default' },
    create: {
      tenantId: 'default',
      openrouterApiKey: body.openrouterApiKey,
      openrouterModel: body.openrouterModel,
      visionModel: body.visionModel,
      monthlyBudgetUsd: body.monthlyBudgetUsd,
      alertThresholdPct: body.alertThresholdPct ?? 80,
      hardCapEnabled: body.hardCapEnabled ?? false,
    },
    update: {
      openrouterApiKey: body.openrouterApiKey,
      openrouterModel: body.openrouterModel,
      visionModel: body.visionModel,
      monthlyBudgetUsd: body.monthlyBudgetUsd,
      alertThresholdPct: body.alertThresholdPct,
      hardCapEnabled: body.hardCapEnabled,
    },
  })
  return NextResponse.json(updated)
}
