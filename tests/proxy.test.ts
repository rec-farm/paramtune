import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Hono } from 'hono'
import { security, apiSecurity } from '@/server/middleware'
import { checkRateLimit } from '@/lib/rateLimit'

vi.mock('@/lib/rateLimit', () => ({ checkRateLimit: vi.fn(() => ({ allowed: true })) }))
const app = new Hono()
app.use('*', security)
app.use('/api/*', apiSecurity)
app.all('*', (c) => c.json({ ok: true }))

beforeEach(() => {
  vi.mocked(checkRateLimit).mockReturnValue({ allowed: true })
  vi.stubEnv('BETTER_AUTH_URL', 'http://localhost')
})
afterEach(() => vi.unstubAllEnvs())

describe('HTTP security middleware', () => {
  it('sets base security headers on HTML and API routes', async () => {
    for (const path of ['/dashboard/ios', '/api/schemas']) {
      const response = await app.request(`http://localhost${path}`)
      expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN')
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
      expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    }
  })
  it('sets production HSTS and scopes CSP to API responses', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const page = await app.request('http://localhost/dashboard')
    expect(page.headers.get('Strict-Transport-Security')).toContain('max-age=')
    expect(page.headers.get('Content-Security-Policy')).toBeNull()
    const api = await app.request('http://localhost/api/schemas')
    expect(api.headers.get('Content-Security-Policy')).toContain("default-src 'self'")
    expect(api.headers.get('Cache-Control')).toBe('no-store')
    vi.stubEnv('NODE_ENV', 'development')
    expect((await app.request('http://localhost/dashboard')).headers.get('Strict-Transport-Security')).toBeNull()
  })
  it('retains CORS and security headers on rate-limit errors', async () => {
    vi.stubEnv('CORS_ORIGIN', 'https://consumer.example')
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: false, retryAfter: 12 })
    const response = await app.request('http://localhost/api/schemas', { headers: { Origin: 'https://consumer.example' } })
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('12')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://consumer.example')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })
  it('returns preflight headers without executing a mutation', async () => {
    const response = await app.request('http://localhost/api/schemas', { method: 'OPTIONS', headers: { Origin: 'http://localhost' } })
    expect(response.status).toBe(204)
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('PUT')
    expect(response.headers.get('Vary')).toBe('Origin')
  })
  it('rejects cross-origin writes, including an origin that is allowed to read', async () => {
    vi.stubEnv('CORS_ORIGIN', 'https://consumer.example')
    const response = await app.request('http://localhost/api/ios', { method: 'POST', headers: { Origin: 'https://consumer.example', 'Content-Type': 'application/json' }, body: '{}' })
    expect(response.status).toBe(403)
  })
  it('rejects simple form submissions and cross-site fetch metadata', async () => {
    expect((await app.request('http://localhost/api/ios', { method: 'POST', body: '{}' })).status).toBe(415)
    expect((await app.request('http://localhost/api/ios', { method: 'POST', headers: { 'Sec-Fetch-Site': 'cross-site', 'Content-Type': 'application/json' }, body: '{}' })).status).toBe(403)
  })
  it('accepts same-origin JSON mutations', async () => {
    expect((await app.request('http://localhost/api/ios', { method: 'POST', headers: { Origin: 'http://localhost', 'Content-Type': 'application/json' }, body: '{}' })).status).toBe(200)
  })
  it('passes cross-site OAuth form callbacks to the authentication verifier only', async () => {
    const options = { method: 'POST', headers: { Origin: 'https://id.example', 'Sec-Fetch-Site': 'cross-site', 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'state=state&code=code' }
    expect((await app.request('http://localhost/api/auth/oauth2/callback/oidc', options)).status).toBe(200)
    expect((await app.request('http://localhost/api/auth/callback/google', options)).status).toBe(200)
    expect((await app.request('http://localhost/api/auth/sign-out', options)).status).toBe(403)
  })
  it('does not trust forwarded IPs by default', async () => {
    await app.request('http://localhost/api/schemas', { headers: { 'X-Forwarded-For': 'attacker' } })
    expect(checkRateLimit).toHaveBeenLastCalledWith('local', 'api')
    vi.stubEnv('TRUST_PROXY', 'true')
    await app.request('http://localhost/api/auth/get-session', { headers: { 'X-Forwarded-For': 'trusted, proxy' } })
    expect(checkRateLimit).toHaveBeenLastCalledWith('trusted', 'api')
  })

  it('never rate-limits back-channel logout from the identity provider', async () => {
    const { checkRateLimit } = await import('@/lib/rateLimit')
    vi.mocked(checkRateLimit).mockClear()
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: false, retryAfter: 42 })
    const response = await app.request('http://localhost/api/auth/backchannel-logout', { method: 'POST', headers: { Origin: 'https://id.example', 'Sec-Fetch-Site': 'cross-site' } })

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
      await app.request(`http://localhost${path}`)
      expect(vi.mocked(checkRateLimit).mock.calls[0]?.[1], path).toBe(budget)
    }
  })
})
