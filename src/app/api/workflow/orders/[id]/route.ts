import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiActor, workflowResponse } from '@/lib/workflow/api'
import { getOrderWorkflow } from '@/lib/workflow/service'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireApiActor()
    return NextResponse.json(await getOrderWorkflow(db, { actorId: actor.id, orderId: (await params).id }))
  } catch (error) { return workflowResponse(error) }
}
