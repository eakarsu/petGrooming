import { withAccess, OFFICE, MANAGEMENT } from '@/lib/operations/access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const petUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  species: z.enum(['DOG', 'CAT', 'OTHER']).optional(),
  breedId: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  weight: z.number().optional().nullable(),
  color: z.string().optional().nullable(),
  microchipNumber: z.string().optional().nullable(),
  isNeutered: z.boolean().optional(),
  temperament: z.string().optional().nullable(),
  specialNeeds: z.string().optional().nullable(),
  allergies: z.string().optional().nullable(),
  feedingInstructions: z.string().optional().nullable(),
})

// GET single pet
async function handleGET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const pet = await db.pet.findUnique({
      where: { id: (await params).id },
      include: {
        breed: true,
        client: true,
        vaccinationRecords: {
          orderBy: { expirationDate: 'asc' },
        },
        behavioralNotes: {
          orderBy: { createdAt: 'desc' },
        },
        groomingHistory: {
          include: {
            groomer: { select: { id: true, name: true, role: true, avatar: true } },
            photos: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        photos: {
          orderBy: { createdAt: 'desc' },
        },
        healthAlerts: {
          where: { isResolved: false },
          orderBy: { createdAt: 'desc' },
        },
        groomingPreferences: true,
      },
    })

    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }

    return NextResponse.json(pet)
  } catch (error) {
    console.error('Get pet error:', error)
    return NextResponse.json({ error: 'Failed to fetch pet' }, { status: 500 })
  }
}

// PUT update pet
async function handlePUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const validatedData = petUpdateSchema.parse(body)

    const updateData: any = { ...validatedData }
    if (validatedData.dateOfBirth) {
      updateData.dateOfBirth = new Date(validatedData.dateOfBirth)
    }

    const pet = await db.pet.update({
      where: { id: (await params).id },
      data: updateData,
      include: {
        breed: true,
        client: true,
      },
    })

    return NextResponse.json(pet)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Update pet error:', error)
    return NextResponse.json({ error: 'Failed to update pet' }, { status: 500 })
  }
}

// DELETE pet (soft delete)
async function handleDELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await db.pet.update({
      where: { id: (await params).id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete pet error:', error)
    return NextResponse.json({ error: 'Failed to delete pet' }, { status: 500 })
  }
}

export const GET = withAccess(undefined, handleGET)
export const PUT = withAccess(OFFICE, handlePUT)
export const DELETE = withAccess(OFFICE, handleDELETE)
