import { withAccess, OFFICE, MANAGEMENT } from '@/lib/operations/access'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function handleGET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const rx = await prisma.prescription.findUnique({ where: { id }, include: { pet: { include: { client: true, breed: true } } } })
    if (!rx) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(rx)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch prescription' }, { status: 500 })
  }
}

async function handlePUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const rx = await prisma.prescription.update({ where: { id }, data: body })
    return NextResponse.json(rx)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 })
  }
}

async function handleDELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.prescription.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete prescription' }, { status: 500 })
  }
}

export const GET = withAccess(undefined, handleGET)
export const PUT = withAccess(MANAGEMENT, handlePUT)
export const DELETE = withAccess(MANAGEMENT, handleDELETE)
