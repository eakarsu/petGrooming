import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/loyalty/redeem
 *
 * Body: { clientId: string, points: number, description?: string }
 *
 * Deducts `points` from the client's loyaltyPoints balance and records
 * a transaction entry with type LOYALTY_POINTS.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, points, description } = body

    if (!clientId) {
      return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
    }

    const pointsToRedeem = typeof points === 'number' ? Math.floor(points) : 0
    if (pointsToRedeem <= 0) {
      return NextResponse.json(
        { error: 'points must be a positive integer' },
        { status: 400 }
      )
    }

    // Fetch current client in a transaction so balance check + update are atomic
    const result = await db.$transaction(async (tx) => {
      const client = await tx.client.findUnique({
        where: { id: clientId },
        select: { id: true, firstName: true, lastName: true, loyaltyPoints: true },
      })

      if (!client) {
        throw new Error('CLIENT_NOT_FOUND')
      }

      if (client.loyaltyPoints < pointsToRedeem) {
        throw new Error('INSUFFICIENT_POINTS')
      }

      // Deduct points
      const updatedClient = await tx.client.update({
        where: { id: clientId },
        data: { loyaltyPoints: { decrement: pointsToRedeem } },
        select: { id: true, firstName: true, lastName: true, loyaltyPoints: true },
      })

      // Fetch the business settings to find the points value (default $0.01/pt)
      const settings = await tx.businessSettings.findFirst()
      const pointsValue = settings?.loyaltyPointsValue ?? 0.01
      const dollarValue = pointsToRedeem * pointsValue

      // Find a staff member to record the transaction (use first admin/manager)
      const staff = await tx.user.findFirst({
        where: { role: { in: ['ADMIN', 'MANAGER'] }, isActive: true },
        select: { id: true },
      })

      if (!staff) {
        throw new Error('NO_STAFF_FOUND')
      }

      // Record as a zero-total transaction flagged as LOYALTY_POINTS redemption
      const transaction = await tx.transaction.create({
        data: {
          clientId,
          staffId: staff.id,
          subtotal: 0,
          tax: 0,
          discount: dollarValue,
          tip: 0,
          total: 0,
          paymentMethod: 'LOYALTY_POINTS',
          paymentStatus: 'COMPLETED',
          loyaltyPointsEarned: 0,
          loyaltyPointsUsed: pointsToRedeem,
          notes: description ?? `Loyalty points redemption — ${pointsToRedeem} pts ($${dollarValue.toFixed(2)} value)`,
        },
      })

      return { updatedClient, dollarValue, transaction }
    })

    return NextResponse.json({
      success: true,
      pointsRedeemed: pointsToRedeem,
      dollarValue: result.dollarValue,
      remainingPoints: result.updatedClient.loyaltyPoints,
      transactionId: result.transaction.id,
      message: `Successfully redeemed ${pointsToRedeem} points ($${result.dollarValue.toFixed(2)} value)`,
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'CLIENT_NOT_FOUND') {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }
      if (error.message === 'INSUFFICIENT_POINTS') {
        return NextResponse.json({ error: 'Insufficient loyalty points' }, { status: 400 })
      }
      if (error.message === 'NO_STAFF_FOUND') {
        return NextResponse.json({ error: 'No staff member found to process redemption' }, { status: 500 })
      }
    }
    console.error('Loyalty redeem error:', error)
    return NextResponse.json({ error: 'Failed to redeem points' }, { status: 500 })
  }
}
