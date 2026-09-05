import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const enabled =
    process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL !== 'false'
  const email = process.env.PROVISION_ADMIN_EMAIL
  const password = process.env.PROVISION_ADMIN_PASSWORD

  if (!enabled || !email || !password) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(
    { email, password },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
