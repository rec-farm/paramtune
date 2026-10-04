import './env.mjs'
import { createServer } from 'vite'
import { spawn } from 'node:child_process'
import { createServer as createPortProbe } from 'node:net'

process.env.NODE_ENV = 'development'
const port = Number(process.env.PORT || 3000)
const apiPort = Number(process.env.API_PORT || 3001)
if (port === apiPort) throw new Error('PORT and API_PORT must be different')
process.env.API_PORT = String(apiPort)
process.env.BETTER_AUTH_URL ||= process.env.PORTLESS_URL || `http://localhost:${port}`
// Refuse occupied ports before spawning a watcher or borrowing another API.
await new Promise<void>((resolve, reject) => {
  const probe = createPortProbe()
  probe.once('error', reject)
  probe.listen(apiPort, '127.0.0.1', () => probe.close(() => resolve()))
})
const devServer = await createServer({ server: { port } })
await devServer.listen()
const api = spawn('pnpm', ['exec', 'tsx', 'watch', '--import', './scripts/env.mjs', 'src/server/index.ts'], {
  stdio: 'inherit', env: { ...process.env, PORT: String(apiPort), HOST: '127.0.0.1' },
})
let closing = false
async function close(code = 0) {
  if (closing) return
  closing = true
  api.kill('SIGTERM')
  await devServer.close()
  process.exitCode = code
}
api.once('exit', (code) => { void close(code || 0) })
api.once('error', (error) => { console.error(error); void close(1) })
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void close() })
try {
  let ready = false
  for (let attempt = 0; attempt < 100 && !closing; attempt++) {
    try {
      ready = (await fetch(`http://127.0.0.1:${apiPort}/healthz`, { signal: AbortSignal.timeout(500) })).ok
    } catch { /* API is starting */ }
    if (ready) break
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  if (!ready) throw new Error('API did not become ready')
  devServer.printUrls()
} catch (error) {
  console.error(error)
  await close(1)
}
