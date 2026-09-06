import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const headers = { 'Cache-Control': 'no-store, private' }
  const localHosts = ['localhost', '127.0.0.1', '[::1]']
  const localRequest = localHosts.includes(request.nextUrl.hostname)
  const enabled =
    process.env.NODE_ENV !== 'production' &&
    process.env.ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'true' && localRequest
  const email = process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL
  const password = process.env.PROVISION_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD

  if (!enabled || !email || !password || request.nextUrl.searchParams.get('status') === '1') {
    return NextResponse.json({ enabled: Boolean(enabled && email && password) }, { headers })
  }

  return NextResponse.json(
    { enabled: true, email, password },
    { headers },
  )
}
