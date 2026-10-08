import { test, expect } from '@playwright/test'

// scripts/e2e.mjs sets OIDC_PLATFORM_EDITORS=e2e-restricted:team-restricted.
const authURL = process.env.E2E_AUTH_URL || 'http://localhost:4380'
const restricted = 'e2e-restricted'
const open = `platform-editors-${Date.now()}`
const ui = '/api/_ui/v1'
const schema = (p: string, v = '1.0.0') => `${ui}/platforms/${p}/versions/${v}/schema`

test('platform editor groups limit writes to listed platforms', async ({ context, playwright }) => {
  const admin = context.request
  expect((await admin.post(`${authURL}/api/auth/dev-login`, { headers: { Origin: authURL } })).ok()).toBe(true)
  // The restricted name is fixed, so this upsert keeps reruns against the same Redis working.
  expect((await admin.post(`/api/${restricted}`, { data: { versions: ['1.0.0'] } })).status()).toBe(201)
  expect((await admin.put(schema(restricted), { data: { content: { by: 'admin' } } })).ok()).toBe(true)

  const signIn = async (groups: string[]) => {
    const session = await playwright.request.newContext()
    expect((await session.post(`${authURL}/api/auth/dev-login`, { headers: { Origin: authURL }, data: { role: 'editor', groups } })).ok()).toBe(true)
    return session
  }
  const [outsider, member] = [await signIn([]), await signIn(['team-restricted'])]
  try {
    expect((await (await outsider.get('/api/auth/get-session')).json()).permissions.restricted).toEqual([restricted])
    expect((await (await member.get('/api/auth/get-session')).json()).permissions.restricted).toEqual([])

    for (const response of [
      await outsider.put(schema(restricted), { data: { content: { by: 'outsider' } } }),
      await outsider.post(`${ui}/platforms/${restricted}/versions`, { data: { version: '9.0.0' } }),
      await outsider.post(`/api/${restricted}/versions`, { data: { version: '9.0.0' } }),
      await outsider.post(`/api/${restricted}`, { data: { versions: ['1.0.0', '9.0.0'] } }),
      await outsider.post(`${ui}/platforms`, { data: { name: restricted } }),
    ]) {
      expect(response.status(), response.url()).toBe(403)
      expect((await response.json()).error).toContain(restricted)
    }
    // Reads stay open, and other platforms stay writable.
    expect((await (await outsider.get(schema(restricted))).json()).schema.content).toEqual({ by: 'admin' })
    expect((await outsider.post(`${ui}/platforms`, { data: { name: open } })).status()).toBe(201)

    expect((await member.put(schema(restricted), { data: { content: { by: 'member' } } })).ok()).toBe(true)
    expect((await (await admin.get(schema(restricted))).json()).schema.content).toEqual({ by: 'member' })
  } finally {
    await Promise.all([outsider.dispose(), member.dispose()])
  }
})

test('the dashboard marks a restricted platform view-only for non-members', async ({ page, context }) => {
  expect((await context.request.post(`${authURL}/api/auth/dev-login`, { headers: { Origin: authURL }, data: { role: 'editor', groups: [] } })).ok()).toBe(true)
  await page.goto(`/dashboard/${restricted}/1.0.0`)
  await expect(page.getByText(`Only ${restricted}’s editors can change it.`, { exact: false })).toBeVisible()
  await page.goto(`/dashboard/${open}`)
  await expect(page.getByText('View only.')).toHaveCount(0)
})
