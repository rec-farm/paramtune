import type { MiddlewareHandler } from 'hono'
import { checkRateLimit } from '@/lib/rateLimit'

/** The public origin is configuration, never an untrusted forwarded Host header. */
export function publicOrigin(request: Request) {
  return new URL(
    process.env.BETTER_AUTH_URL || process.env.BETTER_AUTH_BASE_URL ||
    process.env.PORTLESS_URL || request.url
  ).origin
}

export const security: MiddlewareHandler = async (c, next) => {
  c.header('X-Content-Type-Options', 'nosniff')
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin')
  c.header('X-Frame-Options', 'SAMEORIGIN')
  if (process.env.NODE_ENV === 'production') {
    c.header('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }
  await next()
}

export const apiSecurity: MiddlewareHandler = async (c, next) => {
  const request = c.req.raw
  const origin = request.headers.get('origin')
  const allowedOrigin = process.env.CORS_ORIGIN || publicOrigin(request)
  c.header('Access-Control-Allow-Origin', allowedOrigin === '*' ? '*' : origin === allowedOrigin ? origin : 'null')
  c.header('Vary', 'Origin')
  c.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  c.header('Access-Control-Expose-Headers', 'Retry-After')
  c.header('Access-Control-Max-Age', '86400')
  c.header('Cache-Control', 'no-store')
  if (process.env.NODE_ENV === 'production') {
    c.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'")
  }

  // Only trust client-IP headers when the deployment has a trusted reverse proxy.
  const ip = process.env.TRUST_PROXY === 'true'
    ? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
    : c.env?.clientIp || 'local'
  // Provider logout is authenticated by a signed JWT, not a browser cookie.
  if (c.req.path === '/api/auth/backchannel-logout') {
    await next()
    return
  }
  const authAttempt = /^\/api\/auth\/(sign-in|sign-up|callback|oauth2|dev-login)(\/|$)/.test(c.req.path)
  const rate = checkRateLimit(ip, authAttempt ? 'auth' : 'api')
  if (!rate.allowed) {
    c.header('Retry-After', String(rate.retryAfter))
    return c.json({ error: 'Too many requests' }, 429)
  }
  if (request.method === 'OPTIONS') return c.body(null, 204)

  // OAuth form_post callbacks validate their own state/token in Better Auth.
  const oauthCallback = /^\/api\/auth\/(?:oauth2\/)?callback\/[^/]+$/.test(c.req.path)
  if (!['GET', 'HEAD'].includes(request.method) && !oauthCallback) {
    // Cookie-authenticated mutations require same-origin browser requests.
    // Non-browser API clients may omit Origin but must send application/json.
    if (origin && origin !== publicOrigin(request)) {
      return c.json({ error: 'Untrusted request origin' }, 403)
    }
    if (request.headers.get('sec-fetch-site') === 'cross-site') {
      return c.json({ error: 'Cross-site mutation rejected' }, 403)
    }
    if (!c.req.path.startsWith('/api/auth/') &&
      request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') {
      return c.json({ error: 'Content-Type must be application/json' }, 415)
    }
  }
  await next()
}
