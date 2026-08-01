import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'
import { checkRateLimit } from '@/lib/rateLimit'

let corsWarningLogged = false

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
}

// Headers that are safe on any response (HTML pages or JSON APIs alike).
// Content-Security-Policy is deliberately excluded here: its script-src 'self'
// has only been vetted against JSON API responses, not against Next.js's
// dashboard page markup, so it stays scoped to the API branch below.
function applyBaseSecurityHeaders<T extends NextResponse>(response: T): T {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }
  return response
}

// Every /api response needs CORS + base security headers, including ones
// returned early (e.g. a 429 from the rate limiter below). Without
// Access-Control-Allow-Origin, a cross-origin fetch() can't read an early
// response at all — the caller sees an opaque network error instead of a
// legible 429 with a Retry-After header.
function applyApiResponseHeaders<T extends NextResponse>(response: T, request: NextRequest): T {
  if (process.env.NODE_ENV === 'production' && !process.env.CORS_ORIGIN && !corsWarningLogged) {
    console.warn('CORS_ORIGIN is not set — defaulting to same-origin. Set CORS_ORIGIN to allow cross-origin requests.')
    corsWarningLogged = true
  }

  const origin = request.headers.get('origin') || ''
  const allowedOrigin = process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? request.nextUrl.origin : '*')

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

  applyBaseSecurityHeaders(response)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'",
    )
  }

  return response
}

export function proxy(request: NextRequest) {
  // Dashboard route protection (UX optimization - Server Component validates session for security)
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const sessionCookie = getSessionCookie(request)
    if (!sessionCookie) {
      const returnTo = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)
      return applyBaseSecurityHeaders(
        NextResponse.redirect(new URL(`/login?returnTo=${returnTo}`, request.url)),
      )
    }
    // Has session cookie, allow access (Server Component will validate)
    return applyBaseSecurityHeaders(NextResponse.next())
  }

  // Rate limiting for API routes
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth')
  const { allowed, retryAfter } = checkRateLimit(ip, isAuthRoute ? 'auth' : 'api')
  if (!allowed) {
    return applyApiResponseHeaders(
      NextResponse.json(
        { error: 'Too many requests' },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfter) },
        },
      ),
      request,
    )
  }

  const isPreflight = request.method === 'OPTIONS'
  const response = isPreflight ? new NextResponse(null, { status: 204 }) : NextResponse.next()

  return applyApiResponseHeaders(response, request)
}

