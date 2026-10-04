import './env.mjs'
import { startBackend } from './backend.mjs'
process.env.NODE_ENV ||= 'production'
let backend
let closing = false
async function close(code = 0) {
  if (closing) return
  closing = true
  await backend?.close()
  process.exitCode = code
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { void close() })
try {
  backend = await startBackend({ onExit: (code) => { void close(code) } })
  if (closing) await backend.close()
} catch (error) { console.error(error); await close(1) }
