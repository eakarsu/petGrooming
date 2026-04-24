import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const rx = await prisma.prescription.findUnique({ where: { id }, include: { pet: { include: { client: true, breed: true } } } })
    if (!rx) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(rx)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch prescription' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const rx = await prisma.prescription.update({ where: { id }, data: body })
    return NextResponse.json(rx)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update prescription' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.prescription.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete prescription' }, { status: 500 })
  }
}
