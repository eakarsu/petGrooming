import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * AI usage analytics:
 * - Per-feature counts and total spend in the past N days.
 * - Paginated raw log table.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10)
  const days = parseInt(searchParams.get('days') || '30', 10)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  try {
    const [data, total, byFeature, totalCost] = await Promise.all([
      db.aIUsageLog.findMany({
        where: { createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.aIUsageLog.count({ where: { createdAt: { gte: since } } }),
      db.aIUsageLog.groupBy({
        by: ['feature'],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        _sum: { costUsd: true, tokensIn: true, tokensOut: true },
      }),
      db.aIUsageLog.aggregate({
        where: { createdAt: { gte: since } },
        _sum: { costUsd: true },
      }),
    ])

    return NextResponse.json({
      data,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      byFeature,
      totalCostUsd: totalCost._sum.costUsd || 0,
      windowDays: days,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load usage' },
      { status: 500 },
    )
  }
}
