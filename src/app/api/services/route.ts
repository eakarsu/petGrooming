import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.enum(['BATH', 'HAIRCUT', 'STYLING', 'NAIL_CARE', 'EAR_CARE', 'TEETH_CARE', 'SPECIALTY', 'ADD_ON']),
  basePrice: z.number().min(0, 'Price must be 0 or greater'),
  baseDuration: z.number().min(1, 'Duration must be at least 1 minute'),
  isActive: z.boolean().optional(),
  isAddOn: z.boolean().optional(),
})

// GET all services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const activeOnly = searchParams.get('active') === 'true'

    const where: any = {}
    if (category) where.category = category
    if (activeOnly) where.isActive = true

    const services = await db.service.findMany({
      where,
      include: {
        breedServices: {
          include: { breed: true },
        },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Get services error:', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}

// POST create service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = serviceSchema.parse(body)

    const service = await db.service.create({
      data: validatedData,
    })

    return NextResponse.json(service, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Create service error:', error)
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 })
  }
}
