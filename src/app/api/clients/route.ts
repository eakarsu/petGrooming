import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const clientSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(1, 'Phone is required'),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
})

// GET all clients
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const where = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' as const } },
            { lastName: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
          ],
          isActive: true,
        }
      : { isActive: true }

    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const orderBy: any = {}
    orderBy[sortBy] = sortOrder

    const [clients, total] = await Promise.all([
      db.client.findMany({
        where,
        include: {
          pets: {
            where: { isActive: true },
            include: { breed: true },
          },
          _count: {
            select: { appointments: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.client.count({ where }),
    ])

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Get clients error:', error)
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 })
  }
}

// POST create client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = clientSchema.parse(body)

    // Check if email already exists
    const existing = await db.client.findUnique({
      where: { email: validatedData.email },
    })

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
    }

    const client = await db.client.create({
      data: validatedData,
      include: {
        pets: true,
      },
    })

    return NextResponse.json(client, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Create client error:', error)
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 })
  }
}
