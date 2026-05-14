import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fg = await db.familyGroup.findUnique({
    where: { id: params.id },
    include: { members: true, bundles: { orderBy: { createdAt: 'desc' } } },
  })
  if (!fg) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(fg)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updated = await db.familyGroup.update({
    where: { id: params.id },
    data: { name: body.name, notes: body.notes },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.familyGroup.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
