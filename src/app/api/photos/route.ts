import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const petId = searchParams.get('petId')
    const groomerId = searchParams.get('groomerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const sessionId = searchParams.get('sessionId')

    const where: any = {}

    if (petId) where.petId = petId
    if (sessionId) where.sessionId = sessionId

    if (groomerId) {
      where.session = { groomerId }
    }

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const photos = await db.petPhoto.findMany({
      where,
      include: {
        pet: {
          select: {
            id: true,
            name: true,
            client: { select: { firstName: true, lastName: true } },
          },
        },
        session: {
          select: {
            id: true,
            groomer: { select: { id: true, name: true } },
            checkInTime: true,
            checkOutTime: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group photos by session for before/after pairs
    // For photos without sessions, group by petId to create proper pairs
    const photosBySession = photos.reduce((acc, photo) => {
      // Use sessionId if available, otherwise use petId as fallback for grouping
      const sessionKey = photo.sessionId || `pet-${photo.petId}`
      if (!acc[sessionKey]) {
        acc[sessionKey] = { before: null, after: null, photos: [] }
      }
      if (photo.isBefore) acc[sessionKey].before = photo
      if (photo.isAfter) acc[sessionKey].after = photo
      acc[sessionKey].photos.push(photo)
      return acc
    }, {} as Record<string, { before: any; after: any; photos: any[] }>)

    return NextResponse.json({
      photos,
      groupedBySession: Object.entries(photosBySession).map(([sessionId, data]) => ({
        sessionId: sessionId === 'no-session' ? null : sessionId,
        ...data,
      })),
    })
  } catch (error) {
    console.error('Error fetching photos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch photos' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { petId, url, caption, isBefore, isAfter, sessionId } = body

    const photo = await db.petPhoto.create({
      data: {
        petId,
        url,
        caption,
        isBefore: isBefore || false,
        isAfter: isAfter || false,
        sessionId,
      },
    })

    return NextResponse.json(photo)
  } catch (error) {
    console.error('Error creating photo:', error)
    return NextResponse.json(
      { error: 'Failed to create photo' },
      { status: 500 }
    )
  }
}
