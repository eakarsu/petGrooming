import { withAccess, OFFICE } from '@/lib/operations/access'
import { requireApiActor } from '@/lib/workflow/api'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { uploadImage } from '@/lib/cloudinary'

const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_PHOTO_BYTES = 10 * 1024 * 1024

function validatedPhotoUrl(value: unknown): string | null {
  try {
    const url = new URL(String(value))
    if (url.protocol !== 'https:') return null
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    if (cloudName) {
      if (url.hostname !== 'res.cloudinary.com') return null
      if (!url.pathname.startsWith(`/${cloudName}/image/upload/`)) return null
    }
    return url.toString()
  } catch {
    return null
  }
}

async function handleGET(request: NextRequest) {
  try {
    const actor = await requireApiActor()
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

    // Groomers only see photos from sessions they performed; office staff see all.
    if (actor.role === 'GROOMER') {
      where.session = { ...(where.session ?? {}), groomerId: actor.id }
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

async function handlePOST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? ''

    let photoUrl: string
    let petId: string
    let caption: string | undefined
    let isBefore = false
    let isAfter = false
    let sessionId: string | undefined

    if (contentType.includes('multipart/form-data')) {
      // Handle binary file upload — store in Cloudinary
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file || file.size === 0) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
      }
      if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
        return NextResponse.json({ error: 'Photo must be a JPEG, PNG, WebP, or GIF image' }, { status: 415 })
      }
      if (file.size > MAX_PHOTO_BYTES) {
        return NextResponse.json({ error: 'Photo exceeds the 10 MB limit' }, { status: 413 })
      }

      petId = (formData.get('petId') as string) ?? ''
      caption = (formData.get('caption') as string) ?? undefined
      isBefore = formData.get('isBefore') === 'true'
      isAfter = formData.get('isAfter') === 'true'
      sessionId = (formData.get('sessionId') as string) || undefined

      if (!petId) {
        return NextResponse.json({ error: 'petId is required' }, { status: 400 })
      }

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const filename = `pet-${petId}-${Date.now()}`

      const result = await uploadImage(buffer, filename)

      if (!result.success || !result.url) {
        return NextResponse.json(
          { error: result.error ?? 'Image upload failed' },
          { status: 500 }
        )
      }

      photoUrl = result.url
    } else {
      // Legacy JSON path (url already provided)
      const body = await request.json()
      ;({ petId, caption, isBefore, isAfter } = body)
      sessionId = body.sessionId || undefined

      if (!petId) {
        return NextResponse.json({ error: 'petId is required' }, { status: 400 })
      }

      const validatedUrl = validatedPhotoUrl(body.url)
      if (!validatedUrl) {
        return NextResponse.json({ error: 'url must be an HTTPS image URL from the configured image host' }, { status: 400 })
      }
      photoUrl = validatedUrl
    }

    if (caption !== undefined && typeof caption === 'string' && caption.length > 500) {
      return NextResponse.json({ error: 'caption must be at most 500 characters' }, { status: 400 })
    }

    // The photo must belong to a real pet, and any claimed session must be that pet's session.
    const pet = await db.pet.findFirst({ where: { id: petId, isActive: true }, select: { id: true } })
    if (!pet) {
      return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
    }
    if (sessionId) {
      const session = await db.groomingSession.findFirst({ where: { id: sessionId, petId: pet.id }, select: { id: true } })
      if (!session) {
        return NextResponse.json({ error: 'Grooming session does not belong to this pet' }, { status: 409 })
      }
    }

    const photo = await db.petPhoto.create({
      data: {
        petId: pet.id,
        url: photoUrl,
        caption,
        isBefore: Boolean(isBefore),
        isAfter: Boolean(isAfter),
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

export const GET = withAccess(undefined, handleGET)
export const POST = withAccess(OFFICE, handlePOST)
