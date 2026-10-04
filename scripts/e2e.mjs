import { spawn, spawnSync } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// A bounded integration run owns its server children and a disposable auth DB.
// Redis must be a dedicated test service; never point this at production data.
const directory = await mkdtemp(join(tmpdir(), 'paramtune-e2e-'))
const authURL = 'http://localhost:4481'
const baseURL = 'http://localhost:4482'
const env = {
  ...process.env,
  AUTH_DB_PATH: join(directory, 'auth.db'),
  BETTER_AUTH_SECRET: 'paramtune-disposable-integration-test-secret',
  BETTER_AUTH_URL: baseURL,
  OIDC_ISSUER: '', OIDC_CLIENT_ID: '', OIDC_CLIENT_SECRET: '', GOOGLE_CLIENT_ID: '', GOOGLE_CLIENT_SECRET: '',
  DEV_USER_EMAIL: 'reviewer@paramtune.local', DEV_USER_PASSWORD: 'review-local-password', DEV_USER_NAME: 'Reviewer',
  REDIS_URL: process.env.E2E_REDIS_URL || 'redis://127.0.0.1:6379/15',
  E2E_BASE_URL: baseURL, E2E_AUTH_URL: authURL, E2E_PRODUCTION: '1',
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
  for (const url of [authURL, baseURL]) {
    let occupied = false
    try { await fetch(url); occupied = true } catch { /* free */ }
    if (occupied) throw new Error(`Integration port is occupied: ${url}`)
  }
  const migration = spawnSync(process.execPath, ['dist/server/migrate-auth.js'], { env: { ...env, NODE_ENV: 'test' }, stdio: 'inherit', timeout: 30_000 })
  if (migration.status !== 0) throw new Error('Test auth database migration failed')
  for (const [mode, port, url] of [['development', '4481', authURL], ['production', '4482', baseURL]]) {
    children.push(spawn(process.execPath, ['scripts/start.mjs'], { env: { ...env, NODE_ENV: mode, PORT: port, HOST: '127.0.0.1', BETTER_AUTH_URL: url }, stdio: 'inherit' }))
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
  await rm(directory, { recursive: true, force: true })
}
