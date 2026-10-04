import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiActor, workflowResponse } from '@/lib/workflow/api'
import { suggestVisitBuffers } from '@/lib/workflow/recommendations'

export async function GET() {
  try {
    await requireApiActor(['ADMIN', 'MANAGER', 'RECEPTIONIST'])
    const since = new Date(Date.now() - 180 * 86400000)
    const visits = await db.groomingOrder.findMany({
      where: { jobStatus: 'COMPLETED', updatedAt: { gte: since } },
      orderBy: { updatedAt: 'desc' }, take: 300,
      select: { id: true, technicianId: true, scheduledStart: true, scheduledEnd: true,
        pet: { select: { breed: { select: { size: true } } } },
        quote: { select: { lines: { select: { serviceId: true } } } },
        audits: { select: { id: true, actorId: true, action: true, payload: true, previousHash: true, eventHash: true, createdAt: true } },
      },
    })
    return NextResponse.json({ ...suggestVisitBuffers(visits), windowDays: 180, sampledOrders: visits.length })
  } catch (error) { return workflowResponse(error) }
}
