import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH update appointment status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status } = body

    const validStatuses = [
      'SCHEDULED',
      'CONFIRMED',
      'CHECKED_IN',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
      'NO_SHOW',
    ]

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const appointment = await db.appointment.update({
      where: { id: params.id },
      data: { status },
      include: {
        client: true,
        pet: { include: { breed: true } },
        groomer: true,
        services: { include: { service: true } },
      },
    })

    // If checking in, create a grooming session
    if (status === 'CHECKED_IN') {
      const existingSession = await db.groomingSession.findUnique({
        where: { appointmentId: params.id },
      })

      if (!existingSession && appointment.groomerId) {
        await db.groomingSession.create({
          data: {
            petId: appointment.petId,
            groomerId: appointment.groomerId,
            appointmentId: appointment.id,
            checkInTime: new Date(),
            status: 'CHECKED_IN',
          },
        })
      }
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Update status error:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
