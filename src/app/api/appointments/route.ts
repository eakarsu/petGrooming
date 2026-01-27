import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const appointmentSchema = z.object({
  clientId: z.string().min(1),
  petId: z.string().min(1),
  groomerId: z.string().optional(),
  scheduledDate: z.string(),
  scheduledTime: z.string(),
  duration: z.number().min(15),
  services: z.array(z.string()).min(1),
  notes: z.string().optional(),
  specialRequests: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurrenceRule: z.string().optional(),
})

// GET all appointments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const groomerId = searchParams.get('groomerId')
    const clientId = searchParams.get('clientId')
    const petId = searchParams.get('petId')

    const where: any = {}

    if (date) {
      // Parse date string as local date (not UTC)
      const [year, month, day] = date.split('-').map(Number)
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)
      where.scheduledDate = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    if (status) where.status = status
    if (groomerId) where.groomerId = groomerId
    if (clientId) where.clientId = clientId
    if (petId) where.petId = petId

    const appointments = await db.appointment.findMany({
      where,
      include: {
        client: true,
        pet: {
          include: { breed: true },
        },
        groomer: true,
        services: {
          include: { service: true },
        },
      },
      orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Get appointments error:', error)
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 })
  }
}

// POST create appointment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = appointmentSchema.parse(body)

    // Get services and calculate total duration
    const services = await db.service.findMany({
      where: { id: { in: validatedData.services } },
    })

    const totalDuration = services.reduce((sum, s) => sum + s.baseDuration, 0)

    const appointment = await db.appointment.create({
      data: {
        clientId: validatedData.clientId,
        petId: validatedData.petId,
        groomerId: validatedData.groomerId,
        scheduledDate: new Date(validatedData.scheduledDate),
        scheduledTime: validatedData.scheduledTime,
        duration: totalDuration || validatedData.duration,
        notes: validatedData.notes,
        specialRequests: validatedData.specialRequests,
        isRecurring: validatedData.isRecurring || false,
        recurrenceRule: validatedData.recurrenceRule,
        services: {
          create: services.map((service) => ({
            serviceId: service.id,
            price: service.basePrice,
            duration: service.baseDuration,
          })),
        },
      },
      include: {
        client: true,
        pet: { include: { breed: true } },
        groomer: true,
        services: { include: { service: true } },
      },
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Create appointment error:', error)
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 })
  }
}
