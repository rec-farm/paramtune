import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('better-auth/cookies', () => ({
  getSessionCookie: vi.fn(),
}))
vi.mock('@/lib/rateLimit', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
}))

import { getSessionCookie } from 'better-auth/cookies'
import { proxy } from '@/proxy'

describe('proxy security headers', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('applies security headers when redirecting an unauthenticated dashboard request', () => {
    vi.mocked(getSessionCookie).mockReturnValue(null)
    const request = new NextRequest('http://localhost/dashboard/myplatform')

    const response = proxy(request)

    expect(response.headers.get('location')).toContain('/login')
    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  })

  it('applies security headers to an authenticated dashboard request', () => {
    vi.mocked(getSessionCookie).mockReturnValue('session-token')
    const request = new NextRequest('http://localhost/dashboard/myplatform')

    const response = proxy(request)

    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  })

  it('sets HSTS on dashboard responses in production but not in development', () => {
    vi.mocked(getSessionCookie).mockReturnValue('session-token')
    const request = new NextRequest('http://localhost/dashboard/myplatform')

    vi.stubEnv('NODE_ENV', 'development')
    expect(proxy(request).headers.get('Strict-Transport-Security')).toBeNull()

    vi.stubEnv('NODE_ENV', 'production')
    expect(proxy(request).headers.get('Strict-Transport-Security')).toContain('max-age=')
  })

  it('does not set Content-Security-Policy on dashboard responses', () => {
    vi.mocked(getSessionCookie).mockReturnValue('session-token')
    vi.stubEnv('NODE_ENV', 'production')
    const request = new NextRequest('http://localhost/dashboard/myplatform')

    const response = proxy(request)

    expect(response.headers.get('Content-Security-Policy')).toBeNull()
  })

  it('still applies the same base security headers to API responses', () => {
    const request = new NextRequest('http://localhost/api/schemas')

    const response = proxy(request)

    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  })

  it('applies CORS headers to API responses', () => {
    vi.stubEnv('CORS_ORIGIN', '')
    const request = new NextRequest('http://localhost/api/schemas')

    const response = proxy(request)

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET')
  })

  it('applies CORS and security headers to a rate-limited (429) response', async () => {
    vi.stubEnv('CORS_ORIGIN', '')
    const { checkRateLimit } = await import('@/lib/rateLimit')
    vi.mocked(checkRateLimit).mockReturnValueOnce({ allowed: false, retryAfter: 42 })
    const request = new NextRequest('http://localhost/api/schemas')

    const response = proxy(request)

    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('42')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
  })

  it('never rate-limits back-channel logout from the identity provider', async () => {
    const { checkRateLimit } = await import('@/lib/rateLimit')
    vi.mocked(checkRateLimit).mockClear()
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: false, retryAfter: 42 })
    const request = new NextRequest('http://localhost/api/auth/backchannel-logout', { method: 'POST' })

    const response = proxy(request)

    expect(response.status).toBe(200)
    expect(checkRateLimit).not.toHaveBeenCalled()
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: true })
  })

  it('keeps the strict auth budget for sign-in and session reads on the API budget', async () => {
    const { checkRateLimit } = await import('@/lib/rateLimit')
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: true })
    const budgets = {
      '/api/auth/sign-in/social': 'auth',
      '/api/auth/oauth2/callback/oidc': 'auth',
      '/api/auth/callback/google': 'auth',
      '/api/auth/get-session': 'api',
      '/api/auth/sign-out': 'api',
    }

    for (const [path, budget] of Object.entries(budgets)) {
      vi.mocked(checkRateLimit).mockClear()
      proxy(new NextRequest(`http://localhost${path}`))
      expect(vi.mocked(checkRateLimit).mock.calls[0]?.[1], path).toBe(budget)
    }
  })
})
