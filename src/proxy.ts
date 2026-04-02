import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
}

export function proxy(request: NextRequest) {
  // Dashboard route protection (UX optimization - Server Component validates session for security)
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const sessionCookie = getSessionCookie(request)
    if (!sessionCookie) {
      const returnTo = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)
      return NextResponse.redirect(new URL(`/login?returnTo=${returnTo}`, request.url))
    }
    // Has session cookie, allow access (Server Component will validate)
    return NextResponse.next()
  }

  // API route CORS and security headers handling
  const origin = request.headers.get('origin') || ''
  const allowedOrigin = process.env.CORS_ORIGIN || '*'

  const isPreflight = request.method === 'OPTIONS'
  const response = isPreflight ? new NextResponse(null, { status: 204 }) : NextResponse.next()

  // CORS
  response.headers.set(
    'Access-Control-Allow-Origin',
    allowedOrigin === '*' ? '*' : origin === allowedOrigin ? origin : 'null',
  )
  response.headers.set('Vary', 'Origin')
  response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  response.headers.set(
    'Access-Control-Allow-Headers',
    request.headers.get('Access-Control-Request-Headers') || 'Content-Type, Authorization',
  )
  response.headers.set('Access-Control-Max-Age', '86400')

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'",
    )
  }

  return response
}

