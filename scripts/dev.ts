import './env.mjs'
import { createServer } from 'vite'
import { compileRust, startBackend } from './backend.mjs'
import { selectApiPort } from './dev-port'

process.env.NODE_ENV = 'development'
const port = Number(process.env.PORT || 3000)
process.env.PUBLIC_ORIGIN ||= process.env.PORTLESS_URL || `http://localhost:${port}`
let apiPort = await selectApiPort(process.env.API_PORT)
if (process.env.API_PORT && apiPort === port) throw new Error('PORT and API_PORT must be different')
while (apiPort === port) apiPort = await selectApiPort()
process.env.API_PORT = String(apiPort)
await compileRust()
const devServer = await createServer({ server: { port } })
let backend: Awaited<ReturnType<typeof startBackend>> | undefined
let closing = false
async function close(code = 0) {
  if (closing) return
  closing = true
  await backend?.close()
  await devServer.close()
  process.exitCode = code
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void close() })
try {
  backend = await startBackend({ development: true, env: { ...process.env, PORT: String(apiPort), HOST: '127.0.0.1' }, onExit: (code: number) => { void close(code) } })
  if (closing) await backend.close()
  else {
    await devServer.listen()
    devServer.printUrls()
  }
} catch (error) {
  console.error(error)
  await close(1)
}
