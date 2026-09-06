import { withAccess, OFFICE, MANAGEMENT } from '@/lib/operations/access'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dayBounds } from '@/lib/operations/time'

async function handleGET() {
  try {
    const settings = await db.businessSettings.findUnique({where:{id:'default'}})
    const {start:startToday,end:endToday}=dayBounds(new Date(),settings?.timezone??'America/New_York')

    const appointments = await db.appointment.findMany({
      where: {
        scheduledDate: {
          gte: startToday,
          lt: endToday,
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
      take: 200,
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

export const GET = withAccess(undefined, handleGET)
