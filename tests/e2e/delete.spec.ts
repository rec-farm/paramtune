import { test, expect } from '@playwright/test'

const authURL = process.env.E2E_AUTH_URL || 'http://localhost:4380'
const prefix = `delete-${Date.now()}`
const ui = '/api/_ui/v1'
const json = { 'Content-Type': 'application/json' }
const schema = (p: string, v: string) => `${ui}/platforms/${p}/versions/${encodeURIComponent(v)}/schema`

test('deleting refuses versions other platforms extend, then removes history for good', async ({ context, playwright }) => {
  const request = context.request
  expect((await request.post(`${authURL}/api/auth/dev-login`, { headers: { Origin: authURL } })).ok()).toBe(true)
  const [base, child] = [`${prefix}-base`, `${prefix}-child`]
  for (const platform of [base, child]) {
    expect((await request.post(`/api/${platform}`, { data: { versions: ['1.0.0', '2.0.0'] } })).status()).toBe(201)
  }
  expect((await request.put(schema(base, '1.0.0'), { data: { content: { shared: true } } })).ok()).toBe(true)
  // A dependency inside the same platform never blocks deleting that platform.
  expect((await request.put(schema(base, '2.0.0'), { data: { content: { '@extends': `${base}/1.0.0` } } })).ok()).toBe(true)
  expect((await request.put(schema(child, '1.0.0'), { data: { content: { '@extends': `${base}/^1` } } })).ok()).toBe(true)

  for (const path of [`${ui}/platforms/${base}/versions/1.0.0`, `${ui}/platforms/${base}`]) {
    const blocked = await request.delete(path, { headers: json })
    expect(blocked.status(), path).toBe(409)
    expect((await blocked.json()).error).toContain(`${child}/1.0.0`)
  }
  // Deleting a version nothing resolves to is allowed even while others are extended.
  expect((await request.delete(`${ui}/platforms/${base}/versions/2.0.0`, { headers: json })).ok()).toBe(true)
  expect(await (await request.get(`/api/${base}/versions`)).json()).toEqual(['1.0.0'])
  expect((await request.get(`/api/${base}/2.0.0`)).status()).toBe(404)
  expect((await request.delete(`${ui}/platforms/${base}/versions/2.0.0`, { headers: json })).status()).toBe(404)

  const viewer = await playwright.request.newContext()
  try {
    expect((await viewer.post(`${authURL}/api/auth/dev-login`, { headers: { Origin: authURL }, data: { role: 'member' } })).ok()).toBe(true)
    expect((await viewer.delete(`${ui}/platforms/${child}`, { headers: json })).status()).toBe(403)
  } finally {
    await viewer.dispose()
  }

  expect((await request.put(schema(child, '1.0.0'), { data: { content: { standalone: true } } })).ok()).toBe(true)
  expect((await request.delete(`${ui}/platforms/${base}`, { headers: json })).ok()).toBe(true)
  expect((await request.get(`/api/${base}`)).status()).toBe(404)
  const schemas = await (await request.get('/api/schemas')).json()
  expect(schemas.some((p: { name: string }) => p.name === base)).toBe(false)
  expect((await request.delete(`${ui}/platforms/${base}`, { headers: json })).status()).toBe(404)

  // Recreating the name starts clean: no history comes back.
  expect((await request.post(`/api/${base}`, { data: { versions: ['1.0.0'] } })).status()).toBe(201)
  const fresh = await (await request.get(schema(base, '1.0.0'))).json()
  expect(fresh.history).toEqual([])
})

test('the dashboard deletes a version and a platform after typing its name', async ({ page, context }) => {
  expect((await context.request.post(`${authURL}/api/auth/dev-login`, { headers: { Origin: authURL } })).ok()).toBe(true)
  const platform = `${prefix}-ui`
  expect((await context.request.post(`/api/${platform}`, { data: { versions: ['1.0.0', '1.1.0'] } })).status()).toBe(201)

  await page.goto(`/dashboard/${platform}/1.1.0`)
  await page.getByRole('button', { name: 'Delete version…' }).click()
  const confirm = page.getByRole('button', { name: 'Permanently delete' })
  await expect(confirm).toBeDisabled()
  await page.getByLabel('Type 1.1.0 to confirm').fill('1.1.0')
  await confirm.click()
  await expect(page).toHaveURL(`/dashboard/${platform}`)
  await expect(page.getByRole('link', { name: /v1\.1\.0/ })).toHaveCount(0)

  await page.getByRole('button', { name: 'Delete platform…' }).click()
  await page.getByLabel(`Type ${platform} to confirm`).fill(platform)
  await page.getByRole('button', { name: 'Permanently delete' }).click()
  await expect(page).toHaveURL('/dashboard')
  expect((await context.request.get(`/api/${platform}`)).status()).toBe(404)
})
