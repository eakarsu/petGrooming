import { withAccess, OFFICE, MANAGEMENT } from '@/lib/operations/access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all breeds
async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const species = searchParams.get('species')

    const where = species ? { species: species as any } : {}

    const breeds = await db.breed.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(breeds)
  } catch (error) {
    console.error('Get breeds error:', error)
    return NextResponse.json({ error: 'Failed to fetch breeds' }, { status: 500 })
  }
}

// POST create breed
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json()

    const breed = await db.breed.create({
      data: {
        name: body.name,
        species: body.species || 'DOG',
        size: body.size,
        coatType: body.coatType,
        groomingFrequency: body.groomingFrequency,
        typicalDuration: body.typicalDuration,
        description: body.description,
        imageUrl: body.imageUrl,
      },
    })

    return NextResponse.json(breed, { status: 201 })
  } catch (error) {
    console.error('Create breed error:', error)
    return NextResponse.json({ error: 'Failed to create breed' }, { status: 500 })
  }
}

export const GET = withAccess(undefined, handleGET)
export const POST = withAccess(OFFICE, handlePOST)
