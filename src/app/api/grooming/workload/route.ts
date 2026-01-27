import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { startOfWeek, endOfWeek, addDays, format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateStr = searchParams.get('date')
    const date = dateStr ? new Date(dateStr) : new Date()
    
    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(date, { weekStartsOn: 1 })

    // Get all groomers
    const groomers = await db.user.findMany({
      where: { role: 'GROOMER', isActive: true },
      select: { id: true, name: true, avatar: true },
    })

    // Get appointments for the week
    const appointments = await db.appointment.findMany({
      where: {
        scheduledDate: { gte: weekStart, lte: weekEnd },
        status: { not: 'CANCELLED' },
      },
      include: {
        pet: { select: { name: true } },
        client: { select: { firstName: true, lastName: true } },
        services: { include: { service: true } },
        groomer: { select: { id: true, name: true } },
      },
      orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
    })

    // Build workload data per groomer per day
    const workloadData = groomers.map(groomer => {
      const groomerAppts = appointments.filter(a => a.groomerId === groomer.id)
      const dailyWorkload: Record<string, { appointments: typeof groomerAppts; totalMinutes: number }> = {}

      for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i)
        const dayKey = format(day, 'yyyy-MM-dd')
        const dayAppts = groomerAppts.filter(a => 
          format(a.scheduledDate, 'yyyy-MM-dd') === dayKey
        )
        dailyWorkload[dayKey] = {
          appointments: dayAppts,
          totalMinutes: dayAppts.reduce((sum, a) => sum + a.duration, 0),
        }
      }

      const totalWeekMinutes = Object.values(dailyWorkload).reduce(
        (sum, day) => sum + day.totalMinutes,
        0
      )

      return {
        groomer,
        dailyWorkload,
        totalWeekMinutes,
        maxDailyMinutes: 480, // 8 hours
        maxWeekMinutes: 2400, // 40 hours (5 days)
      }
    })

    return NextResponse.json({
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      workload: workloadData,
    })
  } catch (error) {
    console.error('Error fetching workload:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workload data' },
      { status: 500 }
    )
  }
}
