import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
  const search = searchParams.get('search') || ''

  const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : {}
  const [data, total] = await Promise.all([
    db.familyGroup.findMany({
      where,
      include: { members: true, bundles: { take: 5, orderBy: { createdAt: 'desc' } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    db.familyGroup.count({ where }),
  ])
  return NextResponse.json({ data, page, pageSize, total, totalPages: Math.ceil(total / pageSize) })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { name, primaryClientId, notes, members } = body as {
    name: string
    primaryClientId: string
    notes?: string
    members?: Array<{ clientId: string; petId?: string }>
  }
  if (!name || !primaryClientId) {
    return NextResponse.json({ error: 'name and primaryClientId are required' }, { status: 400 })
  }

  const created = await db.familyGroup.create({
    data: {
      name,
      primaryClientId,
      notes,
      members: members && members.length ? { create: members } : undefined,
    },
    include: { members: true },
  })
  return NextResponse.json(created, { status: 201 })
}
