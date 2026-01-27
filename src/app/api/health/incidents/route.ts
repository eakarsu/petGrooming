import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const incidents = await db.incident.findMany({
      include: {
        reporter: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(incidents)
  } catch (error) {
    console.error('Get incidents error:', error)
    return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    const incident = await db.incident.create({
      data: {
        reportedBy: session.user.id,
        incidentType: body.incidentType,
        severity: body.severity,
        title: body.title,
        description: body.description,
        location: body.location,
        actionsTaken: body.actionsTaken,
      },
      include: {
        reporter: {
          select: { name: true },
        },
      },
    })

    return NextResponse.json(incident, { status: 201 })
  } catch (error) {
    console.error('Create incident error:', error)
    return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 })
  }
}
