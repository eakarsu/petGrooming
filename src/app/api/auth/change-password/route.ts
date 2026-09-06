import { withAccess } from '@/lib/operations/access'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { compare, hash } from 'bcryptjs'

async function handlePOST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current and new passwords are required' }, { status: 400 })
    }

    if (typeof newPassword !== 'string' || newPassword.length < 14 || Buffer.byteLength(newPassword,'utf8') > 72) {
      return NextResponse.json({ error: 'New password must be at least 14 characters' }, { status: 400 })
    }

    const userId = (session.user as any).id
    const user = await db.user.findUnique({ where: { id: userId } })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const isValid = await compare(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }

    const hashedPassword = await hash(newPassword, 12)
    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword, authVersion: { increment: 1 } },
    })

    return NextResponse.json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('Change password error:', error)
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 })
  }
}

export const POST = withAccess(undefined, handlePOST)
