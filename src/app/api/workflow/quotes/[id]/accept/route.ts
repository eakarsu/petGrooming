import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiActor, workflowResponse } from '@/lib/workflow/api'
import { acceptQuote } from '@/lib/workflow/service'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireApiActor(['ADMIN', 'MANAGER', 'RECEPTIONIST'])
    const body = await request.json()
    return NextResponse.json(await acceptQuote(db, { actorId: actor.id, quoteId: (await params).id, expectedVersion: body.expectedVersion, connectors: body.connectors }), { status: 201 })
  } catch (error) { return workflowResponse(error) }
}
