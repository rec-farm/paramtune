import './env.mjs'
import { createServer } from 'vite'
import { spawn } from 'node:child_process'
import { selectApiPort } from './dev-port'

process.env.NODE_ENV = 'development'
const port = Number(process.env.PORT || 3000)
process.env.BETTER_AUTH_URL ||= process.env.PORTLESS_URL || `http://localhost:${port}`
let apiPort = await selectApiPort(process.env.API_PORT)
if (process.env.API_PORT && apiPort === port) throw new Error('PORT and API_PORT must be different')
while (apiPort === port) apiPort = await selectApiPort()
process.env.API_PORT = String(apiPort)
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
