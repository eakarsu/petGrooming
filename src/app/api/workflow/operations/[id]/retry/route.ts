import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiActor, workflowResponse } from '@/lib/workflow/api'
import { retryIntegrationOperation } from '@/lib/workflow/worker'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireApiActor(['ADMIN', 'MANAGER'])
    const body = await request.json()
    return NextResponse.json(await retryIntegrationOperation(db, { actorId: actor.id, operationId: (await params).id, reason: body.reason }))
  } catch (error) { return workflowResponse(error) }
}
