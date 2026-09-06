import { withAccess, OFFICE, MANAGEMENT } from '@/lib/operations/access'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

async function handleGET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const fg = await db.familyGroup.findUnique({
    where: { id: (await params).id },
    include: { members: true, bundles: { orderBy: { createdAt: 'desc' } } },
  })
  if (!fg) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(fg)
}

async function handlePATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const updated = await db.familyGroup.update({
    where: { id: (await params).id },
    data: { name: body.name, notes: body.notes },
  })
  return NextResponse.json(updated)
}

async function handleDELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.familyGroup.delete({ where: { id: (await params).id } })
  return NextResponse.json({ ok: true })
}

export const GET = withAccess(undefined, handleGET)
export const PATCH = withAccess(OFFICE, handlePATCH)
export const DELETE = withAccess(OFFICE, handleDELETE)
