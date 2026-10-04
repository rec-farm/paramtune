import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { migrateAuth } from '@/server/auth-config'

await migrateAuth()
const { authApp } = await import('@/server/auth-app')
const { auth } = await import('@/lib/auth')
const app = new Hono()
app.use('/api/*', bodyLimit({ maxSize: 1024 * 1024, onError: (c) => c.json({ error: 'Request body exceeds 1 MiB' }, 413) }))
app.get('/_internal/session', async (c) => c.json(await auth.api.getSession({ headers: c.req.raw.headers, query: { disableCookieCache: true } })))
app.get('/healthz', (c) => c.json({ ok: true }))
app.route('/', authApp)
app.notFound((c) => c.json({ error: 'Not found' }, 404))
app.onError((error, c) => { console.error(error); return c.json({ error: 'Internal Server Error' }, 500) })

// Never expose the sidecar on the public interface. Rust enforces API security.
const server = serve({ overrideGlobalObjects: false, fetch: app.fetch, hostname: '127.0.0.1', port: Number(process.env.AUTH_PORT) },
  (info) => console.log(`ParamTune auth listening on http://127.0.0.1:${info.port}`))
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close(() => process.exit(0))
    setTimeout(() => process.exit(1), 5000).unref()
  })
}
