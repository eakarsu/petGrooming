import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check if user exists
    const user = await db.user.findUnique({ where: { email } })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ message: 'If an account with that email exists, a reset link has been sent.' })
    }

    // Delete any existing tokens for this email
    await db.passwordResetToken.deleteMany({ where: { email } })

    // Create new token
    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await db.passwordResetToken.create({
      data: { email, token, expiresAt },
    })

    // In production, send email here. For now, log the token.
    console.log(`Password reset token for ${email}: ${token}`)

    return NextResponse.json({
      message: 'If an account with that email exists, a reset link has been sent.',
      // Include token in dev for testing
      ...(process.env.NODE_ENV !== 'production' && { token }),
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}
