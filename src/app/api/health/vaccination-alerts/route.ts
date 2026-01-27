import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { addDays } from 'date-fns'

export async function GET() {
  try {
    const thirtyDaysFromNow = addDays(new Date(), 30)

    const expiringVaccinations = await db.vaccinationRecord.findMany({
      where: {
        expirationDate: {
          lte: thirtyDaysFromNow,
        },
        pet: {
          isActive: true,
        },
      },
      include: {
        pet: {
          include: {
            client: true,
          },
        },
      },
      orderBy: {
        expirationDate: 'asc',
      },
    })

    const alerts = expiringVaccinations.map((record) => ({
      id: record.id,
      petId: record.pet.id,
      petName: record.pet.name,
      ownerName: `${record.pet.client.firstName} ${record.pet.client.lastName}`,
      vaccineName: record.vaccineName,
      expirationDate: record.expirationDate?.toISOString(),
      daysUntilExpiration: record.expirationDate
        ? Math.ceil(
            (record.expirationDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
          )
        : 0,
    }))

    return NextResponse.json(alerts)
  } catch (error) {
    console.error('Vaccination alerts error:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}
