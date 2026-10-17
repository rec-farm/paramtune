import { test, expect } from '@playwright/test'

const authURL = process.env.E2E_AUTH_URL || 'http://localhost:4380'
const prefix = `public-${Date.now()}`
const ui = '/api/_ui/v1'

test('public platforms are readable without a token, but never leak private content', async ({ context, playwright }) => {
  const request = context.request
  expect((await request.post(`${authURL}/api/auth/dev-login`, { headers: { Origin: authURL } })).ok()).toBe(true)
  const [open, secret, app] = [`${prefix}-open`, `${prefix}-secret`, `${prefix}-app`]
  for (const platform of [open, secret, app]) {
    expect((await request.post(`/api/${platform}`, { data: { versions: ['1.0.0'] } })).status()).toBe(201)
  }
  const put = (p: string, content: object) => request.put(`${ui}/platforms/${p}/versions/1.0.0/schema`, { data: { content } })
  expect((await put(open, { greeting: 'hello' })).ok()).toBe(true)
  expect((await put(secret, { apiKey: 'hidden' })).ok()).toBe(true)
  expect((await put(app, { '@extends': `${secret}/1.0.0`, own: true })).ok()).toBe(true)
  const publish = (p: string, value: unknown) => request.patch(`${ui}/platforms/${p}`, { data: { public: value } })

  for (const value of [undefined, 'yes', 1]) {
    expect((await publish(open, value)).status(), JSON.stringify(value)).toBe(400)
  }
  expect((await request.patch(`${ui}/platforms/${prefix}-missing`, { data: { public: true } })).status()).toBe(404)
  // Editors change configuration, but only managers decide who may read it.
  const editor = await playwright.request.newContext()
  try {
    expect((await editor.post(`${authURL}/api/auth/dev-login`, { headers: { Origin: authURL }, data: { role: 'editor' } })).ok()).toBe(true)
    expect((await editor.patch(`${ui}/platforms/${open}`, { data: { public: true } })).status()).toBe(403)
  } finally {
    await editor.dispose()
  }

  // A fresh context has no session cookie and no token.
  const anonymous = await playwright.request.newContext()
  try {
    expect((await anonymous.get(`/api/${open}/1.0.0`)).status()).toBe(401)

    const published = await publish(open, true)
    expect(published.status(), await published.text()).toBe(200)
    expect(await published.json()).toMatchObject({ name: open, public: true })
    const read = await anonymous.get(`/api/${open}/1.0.0`)
    expect(read.status(), await read.text()).toBe(200)
    expect((await read.json()).output).toEqual({ greeting: 'hello' })
    expect(await (await anonymous.get(`/api/${open}/versions`)).json()).toEqual(['1.0.0'])
    expect(await (await anonymous.get(`/api/${open}`)).json()).toMatchObject({ name: open, public: true })
    // A forged session cookie reads as anonymous rather than as an error.
    const forged = await anonymous.get(`/api/${open}/1.0.0`, { headers: { cookie: `__Host-paramtune-session=${'a'.repeat(43)}` } })
    expect(forged.status()).toBe(200)

    // Anonymous callers can't write, list platforms, or tell private from missing.
    expect((await anonymous.post(`/api/${open}/versions`, { data: { version: '2.0.0' } })).status()).toBe(401)
    expect((await anonymous.get('/api/schemas')).status()).toBe(401)
    expect((await anonymous.get(`/api/${secret}/1.0.0`)).status()).toBe(401)
    expect((await anonymous.get(`/api/${prefix}-missing/1.0.0`)).status()).toBe(401)
    expect((await anonymous.get(`${ui}/platforms/${open}/versions/1.0.0/schema`)).status()).toBe(401)
    expect((await anonymous.patch(`${ui}/platforms/${secret}`, { data: { public: true } })).status()).toBe(401)

    // A public platform that extends a private one doesn't reveal the inherited content.
    expect((await publish(app, true)).ok()).toBe(true)
    const inherited = await anonymous.get(`/api/${app}/1.0.0`)
    expect(inherited.status()).toBe(403)
    expect(await inherited.text()).not.toContain('hidden')
    expect((await publish(secret, true)).ok()).toBe(true)
    expect((await (await anonymous.get(`/api/${app}/1.0.0`)).json()).output).toEqual({ apiKey: 'hidden', own: true })

    // Unpublishing takes effect immediately, and repeating it changes nothing.
    for (let i = 0; i < 2; i++) expect((await publish(secret, false)).ok()).toBe(true)
    expect((await anonymous.get(`/api/${secret}/1.0.0`)).status()).toBe(401)
    expect((await anonymous.get(`/api/${app}/1.0.0`)).status()).toBe(403)
    expect((await (await request.get(`/api/${secret}`)).json()).public).toBeUndefined()
  } finally {
    await anonymous.dispose()
  }
})

test('managers publish a platform from its page', async ({ page, context }) => {
  expect((await context.request.post(`${authURL}/api/auth/dev-login`, { headers: { Origin: authURL } })).ok()).toBe(true)
  const platform = `${prefix}-ui`
  expect((await context.request.post(`/api/${platform}`, { data: { versions: ['1.0.0'] } })).status()).toBe(201)
  await page.goto(`/dashboard/${platform}`)
  await expect(page.getByTestId('public-status')).toHaveText(/^Private/)
  await page.getByRole('button', { name: 'Make public' }).click()
  await expect(page.getByTestId('public-status')).toHaveText(/^Public/)
  await page.getByRole('button', { name: 'Make private' }).click()
  await expect(page.getByTestId('public-status')).toHaveText(/^Private/)
})
