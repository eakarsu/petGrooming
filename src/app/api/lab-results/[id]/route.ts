import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const lab = await prisma.labResult.findUnique({ where: { id }, include: { pet: { include: { client: true, breed: true } } } })
    if (!lab) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(lab)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lab result' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const lab = await prisma.labResult.update({ where: { id }, data: body })
    return NextResponse.json(lab)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update lab result' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.labResult.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete lab result' }, { status: 500 })
  }
}
