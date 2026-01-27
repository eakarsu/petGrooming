import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const clientUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
  loyaltyPoints: z.number().optional(),
})

// GET single client
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = await db.client.findUnique({
      where: { id: params.id },
      include: {
        pets: {
          where: { isActive: true },
          include: {
            breed: true,
            vaccinationRecords: true,
            behavioralNotes: true,
            groomingPreferences: true,
          },
        },
        appointments: {
          include: {
            pet: true,
            services: { include: { service: true } },
          },
          orderBy: { scheduledDate: 'desc' },
          take: 10,
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Get client error:', error)
    return NextResponse.json({ error: 'Failed to fetch client' }, { status: 500 })
  }
}

// PUT update client
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = clientUpdateSchema.parse(body)

    // Check if email already exists for another client
    if (validatedData.email) {
      const existing = await db.client.findFirst({
        where: {
          email: validatedData.email,
          NOT: { id: params.id },
        },
      })

      if (existing) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
      }
    }

    const client = await db.client.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        pets: {
          where: { isActive: true },
          include: { breed: true },
        },
      },
    })

    return NextResponse.json(client)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Update client error:', error)
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
  }
}

// DELETE client (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.client.update({
      where: { id: params.id },
      data: { isActive: false },
    })

    // Also deactivate all pets
    await db.pet.updateMany({
      where: { clientId: params.id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete client error:', error)
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
  }
}
