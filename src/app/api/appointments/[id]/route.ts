import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET single appointment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appointment = await db.appointment.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        pet: {
          include: {
            breed: true,
            vaccinationRecords: true,
            behavioralNotes: true,
            groomingPreferences: true,
          },
        },
        groomer: true,
        services: { include: { service: true } },
        session: {
          include: { photos: true },
        },
      },
    })

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Get appointment error:', error)
    return NextResponse.json({ error: 'Failed to fetch appointment' }, { status: 500 })
  }
}

// PUT update appointment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const updateData: any = {}
    if (body.scheduledDate) updateData.scheduledDate = new Date(body.scheduledDate)
    if (body.scheduledTime) updateData.scheduledTime = body.scheduledTime
    if (body.groomerId !== undefined) updateData.groomerId = body.groomerId
    if (body.status) updateData.status = body.status
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.specialRequests !== undefined) updateData.specialRequests = body.specialRequests

    const appointment = await db.appointment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        client: true,
        pet: { include: { breed: true } },
        groomer: true,
        services: { include: { service: true } },
      },
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Update appointment error:', error)
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
  }
}

// DELETE appointment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.appointment.update({
      where: { id: params.id },
      data: { status: 'CANCELLED' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Cancel appointment error:', error)
    return NextResponse.json({ error: 'Failed to cancel appointment' }, { status: 500 })
  }
}
