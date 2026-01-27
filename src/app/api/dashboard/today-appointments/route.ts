import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET() {
  try {
    const today = new Date()
    const startToday = startOfDay(today)
    const endToday = endOfDay(today)

    const appointments = await db.appointment.findMany({
      where: {
        scheduledDate: {
          gte: startToday,
          lte: endToday,
        },
      },
      include: {
        pet: {
          include: {
            breed: true,
          },
        },
        client: true,
        services: {
          include: {
            service: true,
          },
        },
      },
      orderBy: {
        scheduledTime: 'asc',
      },
    })

    const formatted = appointments.map((apt) => ({
      id: apt.id,
      time: apt.scheduledTime,
      petName: apt.pet.name,
      breed: apt.pet.breed.name,
      clientName: `${apt.client.firstName} ${apt.client.lastName}`,
      services: apt.services.map((s) => s.service.name),
      status: apt.status,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Today appointments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    )
  }
}
