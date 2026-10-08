import { spawn } from 'node:child_process'

// A bounded integration run owns its Rust server children.
// Redis must be a dedicated test service; never point this at production data.
const authURL = 'http://localhost:4481'
const baseURL = 'http://localhost:4482'
const setupURL = 'http://localhost:4483'
const env = {
  ...process.env,
  OIDC_ISSUER: '', OIDC_CLIENT_ID: '', OIDC_CLIENT_SECRET: '',
  DEV_USER_EMAIL: 'reviewer@paramtune.local', DEV_USER_NAME: 'Reviewer',
  REDIS_URL: process.env.E2E_REDIS_URL || 'redis://127.0.0.1:6379/15',
  E2E_SETUP_URL: setupURL, E2E_BASE_URL: baseURL, E2E_AUTH_URL: authURL, E2E_PRODUCTION: '1',
  CORS_ORIGIN: baseURL,
  // Rate limits live in shared Redis; a per-run prefix keeps earlier runs from throttling this one.
  RATE_LIMIT_PREFIX: `ratelimit:e2e-${process.pid}-${Date.now()}`,
  // All three servers share one bucket per limit from 127.0.0.1, and each spec signs in several times.
  RATE_LIMIT_API_MAX: '10000', RATE_LIMIT_AUTH_MAX: '1000',
  // Members are read-only and editors can't administer; dev login defaults to admin.
  OIDC_EDITOR_GROUP: 'paramtune-editors', OIDC_ADMIN_GROUP: 'paramtune-admins',
}
const children = []
let timedOut = false
const deadline = setTimeout(() => {
  timedOut = true
  for (const child of children) child.kill('SIGTERM')
}, 180_000)
async function ready(url) {
  for (let i = 0; i < 100; i++) {
    if (timedOut) throw new Error('Integration run timed out')
    try { if ((await fetch(url)).ok) return } catch { /* starting */ }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Server did not become ready: ${url}`)
}
try {
  // Fail instead of borrowing a developer's server or its data.
  for (const url of [authURL, baseURL, setupURL]) {
    let occupied = false
    try { await fetch(url); occupied = true } catch { /* free */ }
    if (occupied) throw new Error(`Integration port is occupied: ${url}`)
  }
  // Development and production share test Redis sessions, with dev login disabled in production.
  for (const [mode, port, url] of [['development', '4481', authURL], ['production', '4482', baseURL], ['production', '4483', setupURL]]) {
    children.push(spawn(process.execPath, ['scripts/start.mjs'], { env: { ...env, NODE_ENV: mode, PORT: port, HOST: '127.0.0.1', PUBLIC_ORIGIN: url }, stdio: 'inherit' }))
    await ready(`${url}/healthz`)
  }
  const tests = spawn('pnpm', ['exec', 'playwright', 'test'], { env, stdio: 'inherit' })
  children.push(tests)
  process.exitCode = await new Promise((resolve) => tests.once('exit', (code) => resolve(code ?? 1)))
} finally {
  clearTimeout(deadline)
  await Promise.all(children.map(async (child) => {
    if (child.exitCode !== null || child.signalCode !== null) return
    child.kill('SIGTERM')
    await new Promise((resolve) => {
      const timer = setTimeout(() => { child.kill('SIGKILL'); resolve() }, 5000)
      child.once('exit', () => { clearTimeout(timer); resolve() })
    })
  }))
}
