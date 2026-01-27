import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const vaccinationSchema = z.object({
  petId: z.string().min(1, 'Pet is required'),
  vaccineName: z.string().min(1, 'Vaccine name is required'),
  dateAdministered: z.string(),
  expirationDate: z.string().optional(),
  veterinarian: z.string().optional(),
  notes: z.string().optional(),
})

export async function GET() {
  try {
    const vaccinations = await db.vaccinationRecord.findMany({
      include: {
        pet: {
          include: {
            client: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { dateAdministered: 'desc' },
      take: 100,
    })

    return NextResponse.json(vaccinations)
  } catch (error) {
    console.error('Get vaccinations error:', error)
    return NextResponse.json({ error: 'Failed to fetch vaccinations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = vaccinationSchema.parse(body)

    const vaccination = await db.vaccinationRecord.create({
      data: {
        petId: validatedData.petId,
        vaccineName: validatedData.vaccineName,
        dateAdministered: new Date(validatedData.dateAdministered),
        expirationDate: validatedData.expirationDate
          ? new Date(validatedData.expirationDate)
          : null,
        veterinarian: validatedData.veterinarian,
        notes: validatedData.notes,
      },
      include: {
        pet: {
          include: {
            client: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    })

    return NextResponse.json(vaccination, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Create vaccination error:', error)
    return NextResponse.json({ error: 'Failed to create vaccination record' }, { status: 500 })
  }
}
