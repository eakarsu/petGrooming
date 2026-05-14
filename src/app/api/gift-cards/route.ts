import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes } from 'crypto'

function generateCode(): string {
  // E.g. PGRO-A1B2-C3D4
  const raw = randomBytes(6).toString('hex').toUpperCase()
  return `PGRO-${raw.slice(0, 4)}-${raw.slice(4, 8)}`
}

// GET /api/gift-cards — list all gift cards (optionally filter by clientId or code)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId')
    const code = searchParams.get('code')

    if (code) {
      // Lookup a single gift card by code
      const card = await db.giftCard.findUnique({
        where: { code },
        include: {
          client: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      })
      if (!card) {
        return NextResponse.json({ error: 'Gift card not found' }, { status: 404 })
      }
      return NextResponse.json({ giftCard: card })
    }

    const where: Record<string, unknown> = {}
    if (clientId) where.clientId = clientId

    const giftCards = await db.giftCard.findMany({
      where,
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ giftCards })
  } catch (error) {
    console.error('Error fetching gift cards:', error)
    return NextResponse.json({ error: 'Failed to fetch gift cards' }, { status: 500 })
  }
}

// POST /api/gift-cards — create a new gift card
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, clientId, expiresAt, recipientName, recipientEmail } = body

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'A positive amount is required' }, { status: 400 })
    }

    const code = generateCode()

    const giftCard = await db.giftCard.create({
      data: {
        code,
        initialBalance: amount,
        currentBalance: amount,
        clientId: clientId || null,
        isActive: true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    return NextResponse.json({ giftCard, recipientName, recipientEmail }, { status: 201 })
  } catch (error) {
    console.error('Error creating gift card:', error)
    return NextResponse.json({ error: 'Failed to create gift card' }, { status: 500 })
  }
}
