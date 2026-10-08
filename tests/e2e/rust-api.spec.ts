import { test, expect } from '@playwright/test'


const authURL = process.env.E2E_AUTH_URL || 'http://localhost:4380'
const nodeURL = ''
const prefix = `rust-${Date.now()}`
const ui = '/api/_ui/v1'
const detail = (p: string, v = '1.0.0') => `${ui}/platforms/${p}/versions/${encodeURIComponent(v)}/schema`

test('Rust API preserves composition, cascading updates and history', async ({ context }) => {
  const request = context.request
  expect((await request.post(`${authURL}/api/auth/dev-login`, { headers: { Origin: authURL } })).ok()).toBe(true)
  // Seed the public API, then read and mutate through dashboard endpoints.
  const base = `${prefix}-base`
  const child = `${prefix}-child`
  const grandchild = `${prefix}-grandchild`
  for (const platform of [base, child, grandchild]) {
    const created = await request.post(`${nodeURL}/api/${platform}`, { data: { versions: ['1.0.0', '1.5.0+build.5', '2.0.0'] } })
    expect(created.status()).toBe(201)
  }
  const content = { enabled: true, nested: { first: 1, second: 2 }, items: [1, 2], numbers: { '10': 1, '2': 0, tiny: 1e-7, large: 1e20, decimal: 1.2345678901234567 } }
  expect((await request.put(`${nodeURL}${detail(base)}`, { data: { content } })).ok()).toBe(true)
  expect((await request.put(`${nodeURL}${detail(base, '1.5.0+build.5')}`, { data: { content: { range: true } } })).ok()).toBe(true)
  // Identical author/content retain sorted-set deduplication across runtimes.
  expect((await request.put(detail(base), { data: { content } })).ok()).toBe(true)
  expect((await (await request.get(detail(base))).json()).history).toHaveLength(1)
  const composed = { '@extends': `${base}/1.0.0`, nested: { second: 3 }, siblings: [{ '@extends': `${base}/^1` }, { '@extends': `${base}/^1` }] }
  expect((await request.put(detail(child), { data: { content: composed } })).ok()).toBe(true)
  const expected = { ...content, nested: { first: 1, second: 3 }, siblings: [{ range: true }, { range: true }] }
  expect((await (await request.get(detail(child))).json()).schema.output).toEqual(expected)
  expect((await request.put(detail(grandchild), { data: { content: { '@extends': `${child}/1.0.0` } } })).ok()).toBe(true)
  const changed = { ...content, enabled: false }
  expect((await request.put(detail(base), { data: { content: changed } })).ok()).toBe(true)
  expect((await (await request.get(detail(grandchild))).json()).schema.output.enabled).toBe(false)
  // Removing a dependency prevents later updates from generating another revision.
  expect((await request.put(detail(child), { data: { content: { detached: true } } })).ok()).toBe(true)
  const before = (await (await request.get(detail(child))).json()).history.length
  expect((await request.put(detail(base), { data: { content: { enabled: true } } })).ok()).toBe(true)
  expect((await (await request.get(detail(child))).json()).history).toHaveLength(before)
  const invalid = await request.put(detail(base), { data: { content: { '@extends': `${base}/1.0.0` } } })
  // Saving a reference to self is detected when the stored graph contains the cycle.
  expect(invalid.status()).toBe(200)
  const cyclic = await request.put(detail(base), { data: { content: { '@extends': `${base}/1.0.0` } } })
  expect(cyclic.status()).toBe(400)
  expect((await cyclic.json()).error).toContain('Circular dependency')
  // The overview reads every version's latest revision in one batch.
  const overview = await (await request.get(`${ui}/overview`)).json()
  expect(overview.failed).toBe(0)
  const statuses = overview.statuses.filter((s: { platform: string }) => s.platform.startsWith(prefix))
  expect(statuses).toHaveLength(9)
  const baseStatus = statuses.find((s: { platform: string, version: string }) => s.platform === base && s.version === '1.0.0')
  expect(baseStatus).toMatchObject({ hasContent: true, author: 'Reviewer' })
  expect(typeof baseStatus.savedAt).toBe('number')
  expect(statuses.find((s: { platform: string, version: string }) => s.platform === child && s.version === '2.0.0')).toEqual({ platform: child, version: '2.0.0', hasContent: false })
  const listed = overview.platforms.find((p: { name: string }) => p.name === base)
  expect(listed).toEqual({ name: base, versions: ['1.0.0', '1.5.0+build.5', '2.0.0'] })
  const compare = { platformA: base, versionA: '1.0.0', platformB: child, versionB: '1.0.0' }
  const rustDiff = await request.post(`${ui}/compare`, { data: compare })
  expect(rustDiff.ok()).toBe(true)
  expect(await rustDiff.json()).toHaveProperty('diffResult')
  const validation = await request.post(`${ui}/validate`, { data: { content: { '@extends': `${base}/^9` } } })
  expect(validation.ok()).toBe(true)
  const cases = [
    { method: 'GET', path: '/api/bad%20name' },
    { method: 'GET', path: `/api/${base}/bad_version` },
    { method: 'GET', path: '/api/%E0%A4%A' },
    { method: 'GET', path: `/api/${base}/%E0%A4%A` },
    { method: 'POST', path: `/api/${base}/versions`, data: { version: ['1.0.0'] } },
    { method: 'POST', path: `/api/${base}/versions`, data: { version: '1.2' } },
    { method: 'POST', path: `/api/${base}`, data: {} },
    { method: 'POST', path: `/api/${base}`, data: { versions: ['01.2.3'] } },
  ]
  for (const fixture of cases) {
    const rust = await request.fetch(fixture.path, fixture)
    expect(rust.status(), fixture.path).toBe(400)
    expect(await rust.json(), fixture.path).toHaveProperty('error')
  }
})

test('Rust rejects unauthenticated writes, forged identity, CSRF, bad bodies and unknown routes', async ({ request }) => {
  const unauthorized = await request.put(detail(`${prefix}-absent`), {
    data: { content: {} }, headers: { 'x-user-id': 'forged', Cookie: 'paramtune-session=forged' },
  })
  expect(unauthorized.status()).toBe(401)
  expect((await request.post(`${ui}/platforms`, { data: { name: 'csrf' }, headers: { Origin: 'https://evil.example' } })).status()).toBe(403)
  expect((await request.post(`${ui}/platforms`, { data: { name: 'csrf' }, headers: { 'Sec-Fetch-Site': 'cross-site' } })).status()).toBe(403)
  expect((await request.post(`${ui}/platforms`, { data: 'body', headers: { 'Content-Type': 'text/plain' } })).status()).toBe(415)
  expect((await request.post(`${authURL}/api/auth/dev-login`, { headers: { Origin: authURL } })).ok()).toBe(true)
  expect((await request.post(`${ui}/platforms`, { data: 'invalid', headers: { 'Content-Type': 'application/json' } })).status()).toBe(400)
  expect((await request.put(detail(`${prefix}-absent`), { data: { content: {} } })).status()).toBe(404)
  const oversized = await request.post(`${ui}/validate`, { data: { content: { large: 'x'.repeat(1024 * 1024) } } })
  expect(oversized.status()).toBe(413)
  const unknown = await request.get('/api/nonexistent/extra/path')
  expect(unknown.status()).toBe(404)
  expect(unknown.headers()['content-type']).toContain('application/json')
  expect(unknown.headers()['cache-control']).toBe('no-store')
  expect((await request.get('/api/example', { headers: { Origin: 'https://evil.example' } })).headers()['access-control-allow-origin']).toBe('null')
})
