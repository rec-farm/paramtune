import { test, expect } from '@playwright/test'

const authURL = process.env.E2E_AUTH_URL || 'http://localhost:4380'
const prefix = `tokens-${Date.now()}`
const ui = '/api/_ui/v1'

test('read-only API tokens are scoped, cannot write, and stop working once revoked', async ({ context, playwright }) => {
  const request = context.request
  expect((await request.post(`${authURL}/api/auth/dev-login`, { headers: { Origin: authURL } })).ok()).toBe(true)
  const [allowed, hidden] = [`${prefix}-allowed`, `${prefix}-hidden`]
  for (const platform of [allowed, hidden]) {
    expect((await request.post(`/api/${platform}`, { data: { versions: ['1.0.0'] } })).status()).toBe(201)
    const schema = `${ui}/platforms/${platform}/versions/1.0.0/schema`
    expect((await request.put(schema, { data: { content: { name: platform } } })).ok()).toBe(true)
  }
  for (const data of [{}, { name: '' }, { name: 'x'.repeat(65) }, { name: 'bad', platforms: [] }, { name: 'bad', platforms: ['bad name'] }]) {
    expect((await request.post(`${ui}/tokens`, { data })).status(), JSON.stringify(data)).toBe(400)
  }
  const created = await request.post(`${ui}/tokens`, { data: { name: `${prefix}-ci`, platforms: [allowed, allowed] } })
  expect(created.status()).toBe(201)
  const { token, record } = await created.json()
  expect(token).toMatch(/^ptk_[A-Za-z0-9_-]{43}$/)
  expect(record).toMatchObject({ name: `${prefix}-ci`, platforms: [allowed], hint: token.slice(-4) })
  // The plaintext is never listed again.
  const listed = await (await request.get(`${ui}/tokens`)).json()
  expect(JSON.stringify(listed)).not.toContain(token)

  // A fresh context has no session cookie: only the bearer token authenticates.
  const service = await playwright.request.newContext({ extraHTTPHeaders: { Authorization: `Bearer ${token}` } })
  try {
    const schemas = await (await service.get('/api/schemas')).json()
    expect(schemas.map((p: { name: string }) => p.name)).toEqual([allowed])
    const read = await service.get(`/api/${allowed}/1.0.0`)
    expect(read.status(), await read.text()).toBe(200)
    expect((await read.json()).output).toEqual({ name: allowed })
    expect(await (await service.get(`/api/${allowed}/versions`)).json()).toEqual(['1.0.0'])
    expect((await service.get(`/api/${hidden}`)).status()).toBe(404)
    expect((await service.get(`/api/${hidden}/1.0.0`)).status()).toBe(404)
    expect((await service.post(`/api/${allowed}/versions`, { data: { version: '2.0.0' } })).status()).toBe(403)
    expect((await service.get(`${ui}/overview`)).status()).toBe(401)
    expect((await service.get(`${ui}/tokens`)).status()).toBe(401)
    const used = (await (await request.get(`${ui}/tokens`)).json()).find((t: { id: string }) => t.id === record.id)
    expect(typeof used.lastUsedAt).toBe('number')

    expect((await request.delete(`${ui}/tokens/${record.id}`, { headers: { 'Content-Type': 'application/json' } })).ok()).toBe(true)
    expect((await service.get('/api/schemas')).status()).toBe(401)
    expect((await request.delete(`${ui}/tokens/${record.id}`, { headers: { 'Content-Type': 'application/json' } })).status()).toBe(404)
  } finally {
    await service.dispose()
  }
  for (const value of ['Bearer nope', `Bearer ptk_${'a'.repeat(43)}`]) {
    const anonymous = await playwright.request.newContext({ extraHTTPHeaders: { Authorization: value } })
    expect((await anonymous.get('/api/schemas')).status()).toBe(401)
    await anonymous.dispose()
  }
})

test('the tokens page creates, reveals once, and revokes a token', async ({ page, context }) => {
  expect((await context.request.post(`${authURL}/api/auth/dev-login`, { headers: { Origin: authURL } })).ok()).toBe(true)
  await page.goto('/dashboard')
  await page.getByRole('link', { name: 'API tokens' }).click()
  await expect(page.getByRole('heading', { name: 'API tokens.' })).toBeVisible()
  const name = `${prefix}-ui`
  await page.getByLabel('Token name').fill(name)
  await page.getByRole('button', { name: 'Create token' }).click()
  await expect(page.getByTestId('new-token')).toHaveText(/^ptk_/)
  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.getByTestId('new-token')).toHaveCount(0)
  await expect(page.getByText(name)).toBeVisible()
  await page.getByRole('button', { name: `Revoke ${name}` }).click()
  await expect(page.getByText(name)).toHaveCount(0)
})

test('a scoped token cannot read content inherited from platforms outside its scope', async ({ context, playwright }) => {
  const request = context.request
  expect((await request.post(`${authURL}/api/auth/dev-login`, { headers: { Origin: authURL } })).ok()).toBe(true)
  const [secret, middle, app] = [`${prefix}-secret`, `${prefix}-middle`, `${prefix}-app`]
  for (const platform of [secret, middle, app]) {
    expect((await request.post(`/api/${platform}`, { data: { versions: ['1.0.0'] } })).status()).toBe(201)
  }
  const put = (p: string, content: object) => request.put(`${ui}/platforms/${p}/versions/1.0.0/schema`, { data: { content } })
  expect((await put(secret, { apiKey: 'hidden' })).ok()).toBe(true)
  expect((await put(middle, { '@extends': `${secret}/1.0.0` })).ok()).toBe(true)
  // Transitive: app → middle → secret.
  expect((await put(app, { '@extends': `${middle}/^1`, own: true })).ok()).toBe(true)
  const tokenFor = async (platforms: string[]) => (await (await request.post(`${ui}/tokens`, { data: { name: `${prefix}-scope`, platforms } })).json()).token as string
  const read = async (token: string) => {
    const service = await playwright.request.newContext({ extraHTTPHeaders: { Authorization: `Bearer ${token}` } })
    try {
      const response = await service.get(`/api/${app}/1.0.0`)
      return { status: response.status(), body: await response.text() }
    } finally { await service.dispose() }
  }
  for (const scope of [[app], [app, middle]]) {
    const denied = await read(await tokenFor(scope))
    expect(denied.status, scope.join()).toBe(403)
    expect(denied.body).not.toContain('hidden')
  }
  const allowed = await read(await tokenFor([app, middle, secret]))
  expect(allowed.status).toBe(200)
  expect(JSON.parse(allowed.body).output).toEqual({ apiKey: 'hidden', own: true })

  // A newer middle version that extends nothing changes what `^1` resolves to now,
  // but app's stored output still holds secret's content until app is saved again.
  expect((await request.post(`/api/${middle}/versions`, { data: { version: '1.1.0' } })).status()).toBe(201)
  expect((await request.put(`${ui}/platforms/${middle}/versions/1.1.0/schema`, { data: { content: { clean: true } } })).ok()).toBe(true)
  const stale = await read(await tokenFor([app, middle]))
  expect(stale.status).toBe(403)
  expect(stale.body).not.toContain('hidden')
  expect((await put(app, { '@extends': `${middle}/^1`, own: true })).ok()).toBe(true)
  const resaved = await read(await tokenFor([app, middle]))
  expect(resaved.status).toBe(200)
  expect(JSON.parse(resaved.body).output).toEqual({ clean: true, own: true })
})
