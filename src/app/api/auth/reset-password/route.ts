import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hash } from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Find valid token
    const resetToken = await db.passwordResetToken.findUnique({ where: { token } })

    if (!resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
    }

    if (resetToken.expiresAt < new Date()) {
      await db.passwordResetToken.delete({ where: { id: resetToken.id } })
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 })
    }

    // Update password
    const hashedPassword = await hash(password, 12)
    await db.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword },
    })

    // Delete used token
    await db.passwordResetToken.delete({ where: { id: resetToken.id } })

    return NextResponse.json({ message: 'Password reset successfully' })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
