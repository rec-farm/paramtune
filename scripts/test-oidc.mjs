// Bounded production integration: signed OIDC tokens over trusted TLS, disposable Redis keys.
import assert from 'node:assert/strict'
import { createHash, createPrivateKey, sign } from 'node:crypto'
import { createServer } from 'node:https'
import { spawn, execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { freePort } from './backend.mjs'
const directory = await mkdtemp(join(tmpdir(), 'paramtune-oidc-'))
const children = []
let provider
const deadline = setTimeout(() => { for (const child of children) child.kill('SIGTERM') }, 90_000)
const subject = `integration-${Date.now()}-${process.pid}`
const signingKey = createPrivateKey(await readFile('backend/tests/fixtures/oidc-test.pem'))
const jwks = JSON.parse(await readFile('backend/tests/fixtures/oidc-test.jwks.json', 'utf8'))
let signingKid = 'test'
function jwt(claims) {
  const head = Buffer.from(JSON.stringify({ alg: 'RS256', kid: signingKid })).toString('base64url')
  const body = Buffer.from(JSON.stringify(claims)).toString('base64url')
  return `${head}.${body}.${sign('RSA-SHA256', Buffer.from(`${head}.${body}`), signingKey).toString('base64url')}`
}
const flows = new Map()
let issuer
try {
  execFileSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', join(directory, 'tls.key'), '-out', join(directory, 'tls.crt'), '-days', '1', '-subj', '/CN=localhost', '-addext', 'subjectAltName=IP:127.0.0.1', '-addext', 'basicConstraints=critical,CA:FALSE'], { stdio: 'ignore' })
  provider = createServer({ key: await readFile(join(directory, 'tls.key')), cert: await readFile(join(directory, 'tls.crt')) }, async (request, response) => {
    response.setHeader('Content-Type', 'application/json')
    if (request.url === '/.well-known/openid-configuration') return response.end(JSON.stringify({ issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`, userinfo_endpoint: `${issuer}/userinfo`, jwks_uri: `${issuer}/jwks`, end_session_endpoint: `${issuer}/logout`, response_types_supported: ['code'], subject_types_supported: ['public'], id_token_signing_alg_values_supported: ['RS256'], token_endpoint_auth_methods_supported: ['client_secret_basic'] }))
    if (request.url === '/jwks') return response.end(JSON.stringify({ keys: jwks.keys.map((key) => ({ ...key, kid: signingKid })) }))
    if (request.url === '/userinfo') {
      const flow = flows.get(request.headers.authorization?.replace('Bearer ', ''))
      if (!flow) { response.statusCode = 401; return response.end('{}') }
      return response.end(JSON.stringify({ sub: flow.badSubject ? 'different' : subject, name: 'Handstamp User', email: 'handstamp@example.test', groups: ['paramtune-admin'] }))
    }
    if (request.url === '/token') {
      const chunks = []
      for await (const chunk of request) chunks.push(chunk)
      const form = new URLSearchParams(Buffer.concat(chunks).toString())
      const flow = flows.get(form.get('code'))
      const challenge = createHash('sha256').update(form.get('code_verifier') || '').digest('base64url')
      if (!flow || flow.used || flow.challenge !== challenge || request.headers.authorization !== `Basic ${Buffer.from('paramtune:test-secret').toString('base64')}` || form.get('redirect_uri') !== `${baseURL}/api/auth/oauth2/callback/oidc`) {
        response.statusCode = 400; return response.end(JSON.stringify({ error: 'invalid_grant' }))
      }
      flow.used = true
      const now = Math.floor(Date.now() / 1000)
      const idToken = jwt({ iss: issuer, sub: subject, aud: flow.badAudience ? 'other-app' : 'paramtune', iat: now, exp: flow.expired ? now - 120 : now + 300, nonce: flow.badNonce ? 'wrong' : flow.nonce })
      return response.end(JSON.stringify({ access_token: form.get('code'), token_type: 'Bearer', id_token: idToken }))
    }
    response.statusCode = 404; response.end('{}')
  })
  await new Promise((resolve) => provider.listen(0, '127.0.0.1', resolve))
  issuer = `https://127.0.0.1:${provider.address().port}`
  const port = await freePort()
  const baseURL = `http://127.0.0.1:${port}`
  // Closure above runs only after baseURL has been initialized.
  const child = spawn('backend/target/debug/paramtune-api', [], { env: { ...process.env, NODE_ENV: 'production', TRUST_PROXY: 'true', HOST: '127.0.0.1', PORT: String(port), PUBLIC_ORIGIN: baseURL, CORS_ORIGIN: baseURL, REDIS_URL: process.env.E2E_REDIS_URL || process.env.REDIS_URL || 'redis://127.0.0.1:6379/15', OIDC_ISSUER: issuer, OIDC_CLIENT_ID: 'paramtune', OIDC_CLIENT_SECRET: 'test-secret', OIDC_ADMIN_GROUP: 'paramtune-admin', OIDC_ROLES_CLAIM: 'groups', OIDC_SCOPES: 'openid profile email groups', OIDC_CA_CERT_FILE: join(directory, 'tls.crt') }, stdio: 'inherit' })
  children.push(child)
  for (let attempt = 0; ; attempt++) {
    try { if ((await fetch(`${baseURL}/healthz`)).ok) break } catch { /* starting */ }
    if (attempt > 100 || child.exitCode !== null) throw new Error('Rust auth test server did not start')
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  let requestNumber = 0
  async function request(path, { cookie, body, ...options } = {}) {
    return fetch(`${baseURL}${path}`, { redirect: 'manual', ...options, headers: { 'X-Forwarded-For': `192.0.2.${++requestNumber}`, ...(cookie ? { Cookie: cookie } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }, ...(body ? { body: JSON.stringify(body) } : {}) })
  }
  function cookieOf(response) { return response.headers.getSetCookie().find((cookie) => cookie.includes('paramtune-')).split(';')[0] }
  async function begin(flags = {}) {
    const response = await request('/api/auth/sign-in/social', { method: 'POST', body: { provider: 'oidc', callbackURL: '/dashboard/platforms' } })
    assert.equal(response.status, 200, await response.clone().text())
    const authorization = new URL((await response.json()).url)
    assert.equal(authorization.searchParams.get('code_challenge_method'), 'S256')
    const code = `code-${flows.size}`
    flows.set(code, { nonce: authorization.searchParams.get('nonce'), challenge: authorization.searchParams.get('code_challenge'), ...flags })
    return { path: `/api/auth/oauth2/callback/oidc?code=${code}&state=${authorization.searchParams.get('state')}`, cookie: cookieOf(response) }
  }
  const login = await begin()
  assert.equal((await request(login.path)).status, 400, 'Missing browser binding must fail')
  const callback = await request(login.path, login)
  assert.equal(callback.status, 303, await callback.clone().text())
  assert.equal(callback.headers.get('location'), '/dashboard/platforms')
  const cookie = cookieOf(callback)
  assert.match(callback.headers.getSetCookie()[0], /HttpOnly; SameSite=Lax/)
  const session = await (await request('/api/auth/get-session', { cookie })).json()
  assert.equal(session.user.name, 'Handstamp User')
  assert.equal(session.user.role, 'admin')
  assert.equal((await request(login.path, login)).status, 400, 'Callback cannot be replayed')
  for (const flags of [{ badNonce: true }, { badAudience: true }, { expired: true }, { badSubject: true }]) {
    const login = await begin(flags)
    assert.equal((await request(login.path, login)).status, 401, `Reject ${JSON.stringify(flags)}`)
  }
  assert.equal((await request('/api/auth/dev-login', { method: 'POST' })).status, 404)
  const logoutClaims = { iss: issuer, sub: subject, aud: 'paramtune', iat: Math.floor(Date.now() / 1000), jti: subject, events: { 'http://schemas.openid.net/event/backchannel-logout': {} } }
  // Provider rotation after login must be picked up during logout verification.
  signingKid = 'rotated'
  const logoutToken = jwt(logoutClaims)
  async function backchannel(token) { return fetch(`${baseURL}/api/auth/backchannel-logout`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ logout_token: token }) }) }
  assert.equal((await backchannel(jwt({ ...logoutClaims, iat: logoutClaims.iat - 900 }))).status, 401)
  const forged = logoutToken.split('.')
  forged[1] = Buffer.from(JSON.stringify({ ...logoutClaims, sub: 'forged' })).toString('base64url')
  assert.equal((await backchannel(forged.join('.'))).status, 401)
  assert.equal((await backchannel(jwt({ ...logoutClaims, nonce: 'forbidden' }))).status, 401)
  assert.equal((await backchannel(jwt({ ...logoutClaims, aud: 'wrong' }))).status, 401)
  assert.equal((await backchannel(logoutToken)).status, 200)
  assert.equal(await (await request('/api/auth/get-session', { cookie })).json(), null)
  assert.equal((await backchannel(logoutToken)).status, 200, 'Logout replay is idempotent')
  const nextLogin = await begin()
  const nextCallback = await request(nextLogin.path, nextLogin)
  assert.equal(nextCallback.status, 303)
  const nextCookie = cookieOf(nextCallback)
  assert.equal((await backchannel(logoutToken)).status, 200)
  assert.equal((await (await request('/api/auth/get-session', { cookie: nextCookie })).json()).user.name, 'Handstamp User')
  const logoutResponse = await request('/api/auth/sign-out', { method: 'POST', cookie: nextCookie })
  assert.equal(logoutResponse.status, 200)
  const url = new URL((await logoutResponse.json()).url)
  assert.equal(url.origin, issuer)
  assert.equal(url.searchParams.get('post_logout_redirect_uri'), `${baseURL}/`)
  assert.match(logoutResponse.headers.getSetCookie()[0], /Max-Age=0/)
  assert.equal(await (await request('/api/auth/get-session', { cookie: nextCookie })).json(), null)
  console.log('Production OIDC integration passed: PKCE, TLS, nonce/audience/expiry/subject validation, replay rejection, roles, sessions, and logout')
} finally {
  clearTimeout(deadline)
  for (const child of children) {
    child.kill('SIGTERM')
    await new Promise((resolve) => { if (child.exitCode !== null) return resolve(); const timer = setTimeout(() => { child.kill('SIGKILL'); resolve() }, 5000); child.once('exit', () => { clearTimeout(timer); resolve() }) })
  }
  await new Promise((resolve) => provider ? provider.close(resolve) : resolve())
  await rm(directory, { recursive: true, force: true })
}
