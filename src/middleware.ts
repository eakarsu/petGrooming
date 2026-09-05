import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const publicPrefixes = ['/auth/login', '/api/auth', '/api/health/', '/api/workflow/webhooks/']
const retiredPublicAuth = ['/api/auth/register', '/api/auth/forgot-password', '/api/auth/reset-password']

export async function middleware(request: NextRequest) {
  function nextPage() {
    const nonce = btoa(crypto.randomUUID());
    const scriptPolicy = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'"}`;
    const csp = `default-src 'self'; img-src 'self' data: https://res.cloudinary.com; style-src 'self' 'unsafe-inline'; ${scriptPolicy}; object-src 'none'; frame-ancestors 'none'; base-uri 'self'`;
    const headers = new Headers(request.headers);
    headers.set('x-nonce', nonce); headers.set('Content-Security-Policy', csp);
    const response = NextResponse.next({ request: { headers } });
    response.headers.set('Content-Security-Policy', csp);
    return response;
  }
  if (retiredPublicAuth.includes(request.nextUrl.pathname)) return NextResponse.json({ error: 'Unsupported API route' }, { status: 404 })
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const allowed = String(process.env.CORS_ALLOWED_ORIGINS || '').split(',').map((origin) => origin.trim()).filter(Boolean)
    const origin = request.headers.get('origin')
    if (origin && origin !== request.nextUrl.origin && !allowed.includes(origin)) return NextResponse.json({ error: 'Origin is not allowed' }, { status: 403 })
  }
  if (publicPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) return nextPage()
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (token && !(token as any).invalid) return nextPage()
  if (request.nextUrl.pathname.startsWith('/api/')) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  const login = new URL('/auth/login', request.url)
  login.searchParams.set('callbackUrl', request.nextUrl.pathname)
  return NextResponse.redirect(login)
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] }
