import { withAccess, OFFICE, MANAGEMENT } from '@/lib/operations/access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET single service
async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const service = await db.service.findUnique({
      where: { id: (await params).id },
      include: {
        breedServices: {
          include: { breed: true },
        },
      },
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    return NextResponse.json(service)
  } catch (error) {
    console.error('Get service error:', error)
    return NextResponse.json({ error: 'Failed to fetch service' }, { status: 500 })
  }
}

// PUT update service
async function handlePUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()

    const service = await db.service.update({
      where: { id: (await params).id },
      data: body,
    })

    return NextResponse.json(service)
  } catch (error) {
    console.error('Update service error:', error)
    return NextResponse.json({ error: 'Failed to update service' }, { status: 500 })
  }
}

// DELETE service (soft delete)
async function handleDELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db.service.update({
      where: { id: (await params).id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete service error:', error)
    return NextResponse.json({ error: 'Failed to delete service' }, { status: 500 })
  }
}

export const GET = withAccess(undefined, handleGET)
export const PUT = withAccess(MANAGEMENT, handlePUT)
export const DELETE = withAccess(MANAGEMENT, handleDELETE)
