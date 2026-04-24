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

    const results = await prisma.labResult.findMany({
      where,
      include: { pet: { include: { client: true, breed: true } } },
      orderBy: { testDate: 'desc' },
    })
    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch lab results' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { petId, testName, testType, testDate, results, normalRange, status, orderedBy, notes } = body

    if (!petId || !testName || !testType) {
      return NextResponse.json({ error: 'petId, testName, and testType are required' }, { status: 400 })
    }

    const lab = await prisma.labResult.create({
      data: {
        petId, testName, testType,
        testDate: new Date(testDate || Date.now()),
        results: results || '',
        normalRange: normalRange || null,
        status: status || 'PENDING',
        orderedBy: orderedBy || null, notes: notes || null,
      },
      include: { pet: { include: { client: true, breed: true } } },
    })
    return NextResponse.json(lab, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create lab result' }, { status: 500 })
  }
}
