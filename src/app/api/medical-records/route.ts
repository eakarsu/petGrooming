import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const petId = searchParams.get('petId')

    const where = petId ? { petId } : {}
    const records = await prisma.medicalRecord.findMany({
      where,
      include: { pet: { include: { client: true, breed: true } } },
      orderBy: { recordDate: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('Medical records fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch medical records' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { petId, vetName, recordDate, diagnosis, symptoms, treatment, followUp, notes } = body

    if (!petId || !diagnosis || !symptoms || !treatment) {
      return NextResponse.json({ error: 'petId, diagnosis, symptoms, and treatment are required' }, { status: 400 })
    }

    const record = await prisma.medicalRecord.create({
      data: {
        petId,
        vetName: vetName || 'Unknown',
        recordDate: new Date(recordDate || Date.now()),
        diagnosis,
        symptoms,
        treatment,
        followUp: followUp || null,
        notes: notes || null,
      },
      include: { pet: { include: { client: true, breed: true } } },
    })
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Medical record create error:', error)
    return NextResponse.json({ error: 'Failed to create medical record' }, { status: 500 })
  }
}
