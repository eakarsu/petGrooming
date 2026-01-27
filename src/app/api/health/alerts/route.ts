import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const healthAlertSchema = z.object({
  petId: z.string().min(1, 'Pet is required'),
  alertType: z.enum([
    'VACCINATION_EXPIRED',
    'HEALTH_CONDITION',
    'SKIN_ISSUE',
    'COAT_ISSUE',
    'BEHAVIOR_CONCERN',
    'INJURY',
    'ALLERGY',
    'OTHER',
  ]),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
})

export async function GET() {
  try {
    const alerts = await db.healthAlert.findMany({
      include: {
        pet: {
          include: {
            client: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: [{ isResolved: 'asc' }, { severity: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    })

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Get health alerts error:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = healthAlertSchema.parse(body)

    const alert = await db.healthAlert.create({
      data: {
        petId: validatedData.petId,
        alertType: validatedData.alertType,
        severity: validatedData.severity,
        title: validatedData.title,
        description: validatedData.description,
      },
      include: {
        pet: {
          include: {
            client: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    })

    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Create health alert error:', error)
    return NextResponse.json({ error: 'Failed to create health alert' }, { status: 500 })
  }
}
