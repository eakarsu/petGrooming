import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const TIERS = [
  { name: 'Bronze', minPoints: 0, maxPoints: 499, discount: 0, color: '#CD7F32' },
  { name: 'Silver', minPoints: 500, maxPoints: 999, discount: 5, color: '#C0C0C0' },
  { name: 'Gold', minPoints: 1000, maxPoints: Infinity, discount: 10, color: '#FFD700' },
]

function getTier(points: number) {
  return TIERS.find(t => points >= t.minPoints && points <= t.maxPoints) || TIERS[0]
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const clientId = searchParams.get('clientId')

    if (clientId) {
      // Get specific client tier
      const client = await db.client.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          loyaltyPoints: true,
          transactions: {
            select: {
              id: true,
              total: true,
              loyaltyPointsEarned: true,
              loyaltyPointsUsed: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      })

      if (!client) {
        return NextResponse.json({ error: 'Client not found' }, { status: 404 })
      }

      const tier = getTier(client.loyaltyPoints)
      const nextTier = TIERS.find(t => t.minPoints > client.loyaltyPoints)
      const pointsToNextTier = nextTier ? nextTier.minPoints - client.loyaltyPoints : 0

      return NextResponse.json({
        client: {
          id: client.id,
          name: `${client.firstName} ${client.lastName}`,
          loyaltyPoints: client.loyaltyPoints,
        },
        tier,
        nextTier,
        pointsToNextTier,
        pointsHistory: client.transactions.map(t => ({
          id: t.id,
          date: t.createdAt,
          earned: t.loyaltyPointsEarned,
          used: t.loyaltyPointsUsed,
          transactionTotal: t.total,
        })),
      })
    }

    // Get all clients with their tiers
    const clients = await db.client.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        loyaltyPoints: true,
      },
      orderBy: { loyaltyPoints: 'desc' },
    })

    const clientsWithTiers = clients.map(client => ({
      ...client,
      tier: getTier(client.loyaltyPoints),
    }))

    // Stats
    const tierCounts = TIERS.map(tier => ({
      tier: tier.name,
      count: clientsWithTiers.filter(c => c.tier.name === tier.name).length,
      color: tier.color,
    }))

    return NextResponse.json({
      tiers: TIERS,
      clients: clientsWithTiers,
      stats: {
        totalClients: clients.length,
        totalPoints: clients.reduce((sum, c) => sum + c.loyaltyPoints, 0),
        tierCounts,
      },
    })
  } catch (error) {
    console.error('Error fetching loyalty tiers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch loyalty data' },
      { status: 500 }
    )
  }
}
