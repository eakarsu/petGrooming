import { withAccess, OFFICE, MANAGEMENT } from '@/lib/operations/access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function handlePATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const alert = await db.healthAlert.update({
      where: { id: (await params).id },
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

export const PATCH = withAccess(OFFICE, handlePATCH)
