import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const petId = searchParams.get('petId')
    const status = searchParams.get('status')

    const where: any = {}
    if (petId) where.petId = petId
    if (status) where.status = status

    const surgeries = await prisma.surgery.findMany({
      where,
      include: { pet: { include: { client: true, breed: true } } },
      orderBy: { surgeryDate: 'desc' },
    })
    return NextResponse.json(surgeries)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch surgeries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { petId, surgeonName, surgeryDate, surgeryType, anesthesiaType, duration, status, preOpNotes, postOpNotes, complications, notes } = body

    if (!petId || !surgeryType || !surgeonName) {
      return NextResponse.json({ error: 'petId, surgeryType, and surgeonName are required' }, { status: 400 })
    }

    const surgery = await prisma.surgery.create({
      data: {
        petId, surgeonName, surgeryType,
        surgeryDate: new Date(surgeryDate || Date.now()),
        anesthesiaType: anesthesiaType || null,
        duration: duration || null,
        status: status || 'SCHEDULED',
        preOpNotes: preOpNotes || null,
        postOpNotes: postOpNotes || null,
        complications: complications || null,
        notes: notes || null,
      },
      include: { pet: { include: { client: true, breed: true } } },
    })
    return NextResponse.json(surgery, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create surgery' }, { status: 500 })
  }
}
