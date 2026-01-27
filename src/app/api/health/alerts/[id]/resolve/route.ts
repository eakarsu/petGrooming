import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const alert = await db.healthAlert.update({
      where: { id: params.id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
      },
    })

    return NextResponse.json(alert)
  } catch (error) {
    console.error('Resolve alert error:', error)
    return NextResponse.json({ error: 'Failed to resolve alert' }, { status: 500 })
  }
}
