import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET transactions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientId = searchParams.get('clientId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}
    if (clientId) where.clientId = clientId
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const transactions = await db.transaction.findMany({
      where,
      include: {
        client: true,
        staff: true,
        items: {
          include: {
            service: true,
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Get transactions error:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

// POST create transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clientId, items, subtotal, tax, discount, tip, total, paymentMethod } = body

    const transaction = await db.transaction.create({
      data: {
        clientId,
        staffId: session.user.id,
        subtotal,
        tax,
        discount,
        tip: tip || 0,
        total,
        paymentMethod,
        paymentStatus: 'COMPLETED',
        loyaltyPointsEarned: Math.floor(total),
        items: {
          create: items.map((item: any) => ({
            itemType: item.type,
            serviceId: item.type === 'SERVICE' ? item.id : null,
            productId: item.type === 'PRODUCT' ? item.id : null,
            quantity: item.quantity,
            unitPrice: item.price,
            total: item.price * item.quantity,
          })),
        },
      },
      include: {
        client: true,
        items: true,
      },
    })

    // Update client loyalty points
    await db.client.update({
      where: { id: clientId },
      data: {
        loyaltyPoints: {
          increment: Math.floor(total),
        },
      },
    })

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Create transaction error:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
