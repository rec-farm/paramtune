import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/auth', () => ({ oidcSettings: null, auth: { api: { getSession: vi.fn() }, handler: vi.fn() } }))
vi.mock('@/connections/redis')
vi.mock('@/lib/rateLimit', () => ({ checkRateLimit: () => ({ allowed: true }) }))
vi.mock('@/models/Platform', () => ({ getPlatforms: vi.fn(), getPlatform: vi.fn(), savePlatform: vi.fn() }))
vi.mock('@/models/Schema', () => ({ getSchema: vi.fn(), getSchemaHistoryWithTimestamps: vi.fn(), saveSchema: vi.fn(), validateSchemaContent: vi.fn(), compareSchemasWithContent: vi.fn() }))
vi.mock('@/lib/auditLog', () => ({ logAudit: vi.fn() }))

import { app } from '@/server/app'
import { auth } from '@/lib/auth'
import { getPlatforms, getPlatform, savePlatform } from '@/models/Platform'
import { getSchema, getSchemaHistoryWithTimestamps, saveSchema } from '@/models/Schema'
import { logAudit } from '@/lib/auditLog'

const root = '/api/_ui/v1'
const schema = `${root}/platforms/ios/versions/1.0.0%2Bbuild.5/schema`
const session = { user: { id: 'reviewer', email: 'reviewer@example.com', name: 'Reviewer' } }
function request(path: string, method = 'GET', data?: unknown) {
  return app.request(`http://localhost${path}`, { method, headers: { 'Content-Type': 'application/json' }, ...(data === undefined || method === 'GET' ? {} : { body: JSON.stringify(data) }) })
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(auth.api.getSession).mockResolvedValue(session as never)
  vi.mocked(getPlatform).mockResolvedValue({ name: 'ios', versions: ['1.0.0+build.5'] })
})

describe('dashboard HTTP contracts', () => {
  it('forwards registered OAuth callback URLs, form bodies, and response cookies', async () => {
    vi.mocked(auth.handler).mockImplementation(async (request) => {
      expect(new URL(request.url).pathname).toBe('/api/auth/callback/oidc')
      expect(new URL(request.url).search).toBe('?state=example')
      if (request.method === 'POST') expect(await request.text()).toBe('code=code')
      return new Response(null, { status: 302, headers: { Location: '/dashboard', 'Set-Cookie': 'example=value; HttpOnly' } })
    })
    for (const method of ['GET', 'POST']) {
      const response = await app.request('http://localhost/api/auth/oauth2/callback/oidc?state=example', {
        method,
        ...(method === 'POST' ? { body: 'code=code', headers: { Origin: 'https://id.example', 'Content-Type': 'application/x-www-form-urlencoded' } } : {}),
      })
      expect(response.status).toBe(302)
      expect(response.headers.get('location')).toBe('/dashboard')
      expect(response.headers.get('set-cookie')).toContain('example=value')
    }
  })
  it('exposes only public runtime login configuration without requiring a session', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null)
    const response = await request('/api/auth/providers')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ oidc: null, google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET), development: false })
    expect(response.headers.get('Cache-Control')).toBe('no-store')
    expect(auth.api.getSession).not.toHaveBeenCalled()
  })
  it('rejects every dashboard operation before touching domain data when signed out', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null)
    for (const [path, method] of [[`${root}/overview`, 'GET'], [`${root}/platforms`, 'POST'], [`${root}/platforms/ios/versions`, 'POST'], [schema, 'GET'], [schema, 'PUT'], [`${root}/validate`, 'POST'], [`${root}/compare`, 'POST']]) {
      expect((await request(path, method, {})).status).toBe(401)
    }
    expect(getPlatforms).not.toHaveBeenCalled()
    expect(savePlatform).not.toHaveBeenCalled()
    expect(saveSchema).not.toHaveBeenCalled()
  })
  it('preserves schema content, history, and hash for semver build metadata URLs', async () => {
    vi.mocked(getSchema).mockResolvedValue({ content: { enabled: true }, output: { enabled: true }, dependencies: [] })
    vi.mocked(getSchemaHistoryWithTimestamps).mockResolvedValue([])
    const response = await request(schema)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ schema: { content: { enabled: true } }, history: [], contentHash: expect.stringMatching(/^[a-f0-9]{64}$/) })
    expect(getSchema).toHaveBeenCalledWith('ios', '1.0.0+build.5')
    expect(response.headers.get('Cache-Control')).toBe('no-store')
  })
  it('uses the session author rather than client-supplied identity when saving/restoring', async () => {
    const response = await request(schema, 'PUT', { content: { enabled: false }, author: { id: 'attacker' } })
    expect(response.status).toBe(200)
    expect(saveSchema).toHaveBeenCalledWith('ios', '1.0.0+build.5', { enabled: false }, { id: 'reviewer', name: 'Reviewer', image: undefined })
    expect(logAudit).toHaveBeenCalledWith(expect.objectContaining({ userId: 'reviewer', action: 'update' }))
  })
  it('rejects missing versions and invalid content before saving', async () => {
    expect((await request(schema, 'PUT', { content: [] })).status).toBe(400)
    vi.mocked(getPlatform).mockResolvedValue(null)
    expect((await request(schema, 'PUT', { content: {} })).status).toBe(404)
    expect(saveSchema).not.toHaveBeenCalled()
  })
  it('rejects duplicate platforms without overwriting their versions', async () => {
    expect((await request(`${root}/platforms`, 'POST', { name: 'ios' })).status).toBe(409)
    expect(savePlatform).not.toHaveBeenCalled()
  })
  it('returns partial overview results when a history read fails', async () => {
    vi.mocked(getPlatforms).mockResolvedValue([{ name: 'ios', versions: ['1.0.0', '2.0.0'] }])
    vi.mocked(getSchemaHistoryWithTimestamps).mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('Redis failure'))
    const response = await request(`${root}/overview`)
    expect(await response.json()).toMatchObject({ failed: 1, statuses: [{ platform: 'ios', version: '1.0.0', hasContent: false }] })
  })
  it('returns JSON for unknown API routes and 405 for unsupported methods', async () => {
    expect((await request('/api/unknown/extra/path')).status).toBe(404)
    expect((await request('/api/schemas', 'DELETE', {})).status).toBe(405)
  })
  it('rejects malformed encoded names and oversized bodies', async () => {
    expect((await request('/api/%E0%A4%A')).status).toBe(400)
    expect((await request(`${root}/platforms`, 'POST', { name: 'x'.repeat(1024 * 1024) })).status).toBe(413)
  })
})
