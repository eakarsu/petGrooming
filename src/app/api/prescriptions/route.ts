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

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: { pet: { include: { client: true, breed: true } } },
      orderBy: { prescribedDate: 'desc' },
    })
    return NextResponse.json(prescriptions)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { petId, vetName, medication, dosage, frequency, duration, prescribedDate, status, instructions, notes } = body

    if (!petId || !medication || !dosage || !frequency) {
      return NextResponse.json({ error: 'petId, medication, dosage, and frequency are required' }, { status: 400 })
    }

    const rx = await prisma.prescription.create({
      data: {
        petId, vetName: vetName || 'Unknown', medication, dosage, frequency,
        duration: duration || 'As directed',
        prescribedDate: new Date(prescribedDate || Date.now()),
        status: status || 'ACTIVE',
        instructions: instructions || null, notes: notes || null,
      },
      include: { pet: { include: { client: true, breed: true } } },
    })
    return NextResponse.json(rx, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create prescription' }, { status: 500 })
  }
}
