import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/gift-cards/redeem — redeem a gift card by code for a given amount
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, amount } = body

    if (!code) {
      return NextResponse.json({ error: 'Gift card code is required' }, { status: 400 })
    }

    const redeemAmount = typeof amount === 'number' ? amount : null

    const giftCard = await db.giftCard.findUnique({ where: { code } })

    if (!giftCard) {
      return NextResponse.json({ error: 'Gift card not found' }, { status: 404 })
    }

    if (!giftCard.isActive) {
      return NextResponse.json({ error: 'Gift card is inactive' }, { status: 400 })
    }

    if (giftCard.expiresAt && giftCard.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Gift card has expired' }, { status: 400 })
    }

    if (giftCard.currentBalance <= 0) {
      return NextResponse.json({ error: 'Gift card has no remaining balance' }, { status: 400 })
    }

    const deduct = redeemAmount !== null
      ? Math.min(redeemAmount, giftCard.currentBalance)
      : giftCard.currentBalance // redeem full balance if no amount given

    const newBalance = giftCard.currentBalance - deduct

    const updated = await db.giftCard.update({
      where: { id: giftCard.id },
      data: {
        currentBalance: newBalance,
        isActive: newBalance > 0,
      },
    })

    return NextResponse.json({
      success: true,
      amountRedeemed: deduct,
      remainingBalance: updated.currentBalance,
      giftCard: updated,
    })
  } catch (error) {
    console.error('Error redeeming gift card:', error)
    return NextResponse.json({ error: 'Failed to redeem gift card' }, { status: 500 })
  }
}
