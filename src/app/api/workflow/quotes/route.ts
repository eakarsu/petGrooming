import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireApiActor, workflowResponse } from '@/lib/workflow/api'
import { requestQuote } from '@/lib/workflow/service'

export async function POST(request: NextRequest) {
  try {
    const actor = await requireApiActor(['ADMIN', 'MANAGER', 'RECEPTIONIST'])
    const body = await request.json()
    const quote = await requestQuote(db, { actorId: actor.id, ...body })
    return NextResponse.json(quote, { status: quote.status === 'DRAFT' ? 202 : 200 })
  } catch (error) { return workflowResponse(error) }
}

export async function GET() {
  try {
    await requireApiActor(['ADMIN', 'MANAGER', 'RECEPTIONIST'])
    return NextResponse.json(await db.groomingQuote.findMany({ include: { client: true, pet: true, lines: true, order: true }, orderBy: { createdAt: 'desc' }, take: 100 }))
  } catch (error) { return workflowResponse(error) }
}
