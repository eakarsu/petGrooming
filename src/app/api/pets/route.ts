import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const petSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  clientId: z.string().min(1, 'Client is required'),
  species: z.enum(['DOG', 'CAT', 'OTHER']),
  breedId: z.string().min(1, 'Breed is required'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']),
  weight: z.number().optional(),
  color: z.string().optional(),
  microchipNumber: z.string().optional(),
  isNeutered: z.boolean().optional(),
  temperament: z.string().optional(),
  specialNeeds: z.string().optional(),
  allergies: z.string().optional(),
  feedingInstructions: z.string().optional(),
})

// GET all pets
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const clientId = searchParams.get('clientId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where: any = { isActive: true }

    if (clientId) {
      where.clientId = clientId
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { client: { firstName: { contains: search, mode: 'insensitive' } } },
        { client: { lastName: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [pets, total] = await Promise.all([
      db.pet.findMany({
        where,
        include: {
          breed: true,
          client: true,
          vaccinationRecords: {
            orderBy: { expirationDate: 'asc' },
            take: 5,
          },
          _count: {
            select: { groomingHistory: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.pet.count({ where }),
    ])

    return NextResponse.json({
      pets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get pets error:', error)
    return NextResponse.json({ error: 'Failed to fetch pets' }, { status: 500 })
  }
}

// POST create pet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = petSchema.parse(body)

    const pet = await db.pet.create({
      data: {
        name: validatedData.name,
        clientId: validatedData.clientId,
        species: validatedData.species,
        breedId: validatedData.breedId,
        dateOfBirth: validatedData.dateOfBirth
          ? new Date(validatedData.dateOfBirth)
          : null,
        gender: validatedData.gender,
        weight: validatedData.weight,
        color: validatedData.color,
        microchipNumber: validatedData.microchipNumber,
        isNeutered: validatedData.isNeutered || false,
        temperament: validatedData.temperament,
        specialNeeds: validatedData.specialNeeds,
        allergies: validatedData.allergies,
        feedingInstructions: validatedData.feedingInstructions,
      },
      include: {
        breed: true,
        client: true,
      },
    })

    return NextResponse.json(pet, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Create pet error:', error)
    return NextResponse.json({ error: 'Failed to create pet' }, { status: 500 })
  }
}
