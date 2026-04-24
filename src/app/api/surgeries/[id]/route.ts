import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const surgery = await prisma.surgery.findUnique({ where: { id }, include: { pet: { include: { client: true, breed: true } } } })
    if (!surgery) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(surgery)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch surgery' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const surgery = await prisma.surgery.update({ where: { id }, data: body })
    return NextResponse.json(surgery)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update surgery' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.surgery.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete surgery' }, { status: 500 })
  }
}
