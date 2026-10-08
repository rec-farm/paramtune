import { test, expect } from '@playwright/test'

// The integration servers set both groups, so members are read-only, editors write
// but don't administer, and dev login defaults to admin.
const authURL = process.env.E2E_AUTH_URL || 'http://localhost:4380'
const platform = `roles-${Date.now()}`
const ui = '/api/_ui/v1'
const schema = `${ui}/platforms/${platform}/versions/1.0.0/schema`
const json = { 'Content-Type': 'application/json' }

test('roles from OIDC groups gate writes and administration on the server', async ({ playwright }) => {
  const signIn = async (role?: string) => {
    const context = await playwright.request.newContext()
    const login = await context.post(`${authURL}/api/auth/dev-login`, { headers: { Origin: authURL }, ...(role ? { data: { role } } : {}) })
    expect(login.ok(), role).toBe(true)
    return context
  }
  const [admin, editor, viewer] = [await signIn(), await signIn('editor'), await signIn('member')]
  try {
    expect((await (await admin.get('/api/auth/get-session')).json()).permissions).toMatchObject({ write: true, manage: true })
    expect((await (await editor.get('/api/auth/get-session')).json()).permissions).toMatchObject({ write: true, manage: false })
    expect((await (await viewer.get('/api/auth/get-session')).json()).permissions).toMatchObject({ write: false, manage: false })
    expect((await (await playwright.request.newContext()).post(`${authURL}/api/auth/dev-login`, { headers: { Origin: authURL }, data: { role: 'owner' } })).status()).toBe(400)

    expect((await editor.post(`${ui}/platforms`, { data: { name: platform } })).status()).toBe(201)
    expect((await editor.post(`${ui}/platforms/${platform}/versions`, { data: { version: '1.0.0' } })).status()).toBe(201)
    expect((await editor.put(schema, { data: { content: { on: true } } })).ok()).toBe(true)

    // Viewers read everything, including validation and comparison, but change nothing.
    expect((await viewer.get(`/api/${platform}/1.0.0`)).ok()).toBe(true)
    expect((await viewer.get(schema)).ok()).toBe(true)
    expect((await viewer.get(`${ui}/overview`)).ok()).toBe(true)
    expect((await viewer.post(`${ui}/validate`, { data: { content: {} } })).ok()).toBe(true)
    expect((await viewer.post(`${ui}/compare`, { data: { platformA: platform, versionA: '1.0.0', platformB: platform, versionB: '1.0.0' } })).ok()).toBe(true)
    for (const response of [
      await viewer.post(`${ui}/platforms`, { data: { name: `${platform}-x` } }),
      await viewer.post(`${ui}/platforms/${platform}/versions`, { data: { version: '2.0.0' } }),
      await viewer.put(schema, { data: { content: { on: false } } }),
      await viewer.post(`/api/${platform}`, { data: { versions: ['1.0.0'] } }),
      await viewer.post(`/api/${platform}/versions`, { data: { version: '2.0.0' } }),
      await viewer.get(`${ui}/tokens`),
      await viewer.post(`${ui}/tokens`, { data: { name: 'nope' } }),
      await viewer.delete(`${ui}/tokens/0000000000000000`, { headers: json }),
    ]) {
      expect(response.status(), response.url()).toBe(403)
      expect((await response.json()).error).toBeTruthy()
    }
    expect((await (await viewer.get(schema)).json()).schema.content).toEqual({ on: true })
    expect((await editor.get(`${ui}/tokens`)).status()).toBe(403)
    expect((await editor.delete(`${ui}/platforms/${platform}`, { headers: json })).status()).toBe(403)
    expect((await admin.get(`${ui}/tokens`)).ok()).toBe(true)
  } finally {
    await Promise.all([admin, editor, viewer].map((context) => context.dispose()))
  }
})

test('viewers see a read-only dashboard without administration links', async ({ page, context }) => {
  expect((await context.request.post(`${authURL}/api/auth/dev-login`, { headers: { Origin: authURL }, data: { role: 'member' } })).ok()).toBe(true)
  await page.goto('/dashboard')
  await expect(page.getByText('View only.')).toBeVisible()
  await expect(page.getByRole('link', { name: 'API tokens' })).toHaveCount(0)
})
