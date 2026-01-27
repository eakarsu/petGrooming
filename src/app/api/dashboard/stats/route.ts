import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns'

export async function GET() {
  try {
    const today = new Date()
    const startToday = startOfDay(today)
    const endToday = endOfDay(today)
    const startWeek = startOfWeek(today)
    const endWeek = endOfWeek(today)

    const [
      todayAppointments,
      weekTransactions,
      totalClients,
      totalPets,
      pendingCheckIns,
      completedToday,
    ] = await Promise.all([
      // Today's appointments
      db.appointment.count({
        where: {
          scheduledDate: {
            gte: startToday,
            lte: endToday,
          },
        },
      }),
      // Week revenue
      db.transaction.aggregate({
        where: {
          createdAt: {
            gte: startWeek,
            lte: endWeek,
          },
          paymentStatus: 'COMPLETED',
        },
        _sum: {
          total: true,
        },
      }),
      // Total clients
      db.client.count({
        where: { isActive: true },
      }),
      // Total pets
      db.pet.count({
        where: { isActive: true },
      }),
      // Pending check-ins
      db.appointment.count({
        where: {
          scheduledDate: {
            gte: startToday,
            lte: endToday,
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED'],
          },
        },
      }),
      // Completed today
      db.appointment.count({
        where: {
          scheduledDate: {
            gte: startToday,
            lte: endToday,
          },
          status: 'COMPLETED',
        },
      }),
    ])

    return NextResponse.json({
      todayAppointments,
      weekRevenue: weekTransactions._sum.total || 0,
      totalClients,
      totalPets,
      pendingCheckIns,
      completedToday,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
