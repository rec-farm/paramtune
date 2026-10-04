import { spawn } from 'node:child_process'
import { createServer } from 'node:net'
import { access } from 'node:fs/promises'

export async function freePort() {
  return new Promise((resolve, reject) => {
    const probe = createServer()
    probe.once('error', reject)
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address()
      probe.close((error) => error ? reject(error) : resolve(address.port))
    })
  })
}
export async function compileRust() {
  const args = ['build', '--locked', '--manifest-path', 'backend/Cargo.toml']
  await new Promise((resolve, reject) => {
    const child = spawn('cargo', args, { stdio: 'inherit' })
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`Rust build failed (${code})`)))
  })
}
export async function startBackend({ env = process.env, development = false, onExit = () => {} } = {}) {
  const children = []
  let closing = false
  let closePromise
  const detached = process.platform !== 'win32'
  function launch(command, args, childEnv) {
    const child = spawn(command, args, { env: childEnv, stdio: 'inherit', detached })
    children.push(child)
    child.once('error', (error) => {
      console.error(error)
      if (!closing) void close().then(() => onExit(1))
    })
    child.once('exit', (code) => {
      if (!closing) void close().then(() => onExit(code || 1))
    })
    return child
  }
  function signal(child, signal) {
    if (child.exitCode !== null || child.signalCode !== null || !child.pid) return
    try { if (detached) process.kill(-child.pid, signal); else child.kill(signal) } catch (error) { if (error.code !== 'ESRCH') throw error }
  }
  function close() {
    if (closePromise) return closePromise
    closing = true
    closePromise = Promise.all(children.map((child) => new Promise((resolve) => {
      if (child.exitCode !== null || child.signalCode !== null || !child.pid) return resolve()
      const timer = setTimeout(() => { signal(child, 'SIGKILL'); resolve() }, 5000)
      child.once('exit', () => { clearTimeout(timer); resolve() })
      signal(child, 'SIGTERM')
    })))
    return closePromise.then(() => {})
  }
  async function ready(url) {
    for (let attempt = 0; attempt < 150; attempt++) {
      if (closing || children.some((child) => child.exitCode !== null || child.signalCode !== null)) throw new Error('Backend exited before readiness')
      try { if ((await fetch(url, { signal: AbortSignal.timeout(500) })).ok) return } catch { /* starting */ }
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    throw new Error(`Backend did not become ready: ${url}`)
  }
  const apiEnv = { ...env, NODE_ENV: env.NODE_ENV || 'production' }
  try {
    const binary = env.PARAMTUNE_API_BINARY || `backend/target/${development ? 'debug' : 'release'}/paramtune-api`
    await access(binary)
    launch(binary, [], apiEnv)
    await ready(`http://127.0.0.1:${env.PORT || 3000}/healthz`)
    return { close }
  } catch (error) { await close(); throw error }
}
