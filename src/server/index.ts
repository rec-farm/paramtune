import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFile } from 'node:fs/promises'
import redis from '@/connections/redis'
import { migrateAuth } from '@/server/auth-config'

// Finish schema upgrades before accepting any requests.
await migrateAuth()
// Better Auth checks the schema during initialization; import it only after
// the migration so a fresh database cannot race that check.
const { app } = await import('@/server/app')
const { auth } = await import('@/lib/auth')

const production = process.env.NODE_ENV === 'production'
if (production) {
  app.use('/assets/*', async (c, next) => {
    c.header('Cache-Control', 'public, max-age=31536000, immutable')
    await next()
  })
  app.get('/', serveStatic({ path: './dist/client/index.html' }))
  app.get('/api-docs', serveStatic({ path: './dist/client/api-docs/index.html' }))
  app.use('*', serveStatic({ root: './dist/client' }))
  app.get('*', async (c) => {
    const path = c.req.path
    const dashboard = path === '/dashboard' || path.startsWith('/dashboard/')
    if (dashboard) {
      c.header('Cache-Control', 'no-store')
      const session = await auth.api.getSession({ headers: c.req.raw.headers })
      if (!session) return c.redirect(`/login?returnTo=${encodeURIComponent(path + new URL(c.req.url).search)}`)
    }
    const knownRoute = path === '/login' || /^\/dashboard(?:\/[^/]+){0,2}\/?$/.test(path)
    if (/\.[a-z0-9]+$/i.test(path) && !dashboard) return c.text('Not found', 404)
    return c.html(await readFile('./dist/client/app.html', 'utf8'), knownRoute ? 200 : 404)
  })
}

const server = serve({
  // Preserve native Web Request/Response identity for Effect error handling.
  overrideGlobalObjects: false,
  fetch: (request, env) => app.fetch(request, { clientIp: env.incoming.socket.remoteAddress }),
  hostname: process.env.HOST || '0.0.0.0',
  port: Number(process.env.PORT || 3000),
}, (info) => console.log(`ParamTune API listening on http://localhost:${info.port}`))

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    server.close(() => { redis.disconnect(); process.exit(0) })
    setTimeout(() => process.exit(1), 5000).unref()
  })
}
