import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { HTTPException } from 'hono/http-exception'
import { auth, oidcSettings } from '@/lib/auth'
import { POST as backchannelLogout } from '@/server/routes/backchannel-logout'
import * as oauthCallback from '@/server/routes/oauth-callback'
import { security, apiSecurity } from '@/server/middleware'
import { dashboard } from '@/server/routes/dashboard'
import * as platform from '@/server/routes/platform'
import * as versions from '@/server/routes/versions'
import * as version from '@/server/routes/version'
import * as schemas from '@/server/routes/schemas'
import { POST as devLogin } from '@/server/routes/dev-login'

export const app = new Hono<{ Bindings: { clientIp?: string } }>()
app.use('*', security)
app.use('/api/*', apiSecurity)
app.use('/api/*', bodyLimit({ maxSize: 1024 * 1024, onError: (c) => c.json({ error: 'Request body exceeds 1 MiB' }, 413) }))
app.onError((error, c) => {
  if (error instanceof HTTPException) return c.json({ error: error.message }, error.status)
  if (error instanceof URIError) return c.json({ error: 'Malformed percent-encoding' }, 400)
  if (error.message === 'Unauthorized') return c.json({ error: 'Unauthorized' }, 401)
  // Expected domain failures are safe to display; infrastructure details are not.
  if ('_tag' in error && ['InvalidContentError', 'CircularDependencyError', 'VersionNotFoundError', 'MissingPlatformError'].includes(String(error._tag))) {
    return c.json({ error: error.message }, 400)
  }
  if (error.message.startsWith('Invalid version') || error.message.startsWith('Invalid platform')) {
    return c.json({ error: error.message }, 400)
  }
  console.error(error)
  return c.json({ error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error' }, 500)
})
app.get('/healthz', (c) => c.json({ ok: true }))
app.get('/api/auth/providers', (c) => c.json({
  oidc: oidcSettings ? { label: oidcSettings.displayName } : null,
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  development: process.env.NODE_ENV === 'development',
}))
app.post('/api/auth/backchannel-logout', (c) => backchannelLogout(c.req.raw))
app.on(['GET', 'POST'], '/api/auth/oauth2/callback/:providerId', (c) => oauthCallback.GET(c.req.raw, {
  params: Promise.resolve({ providerId: c.req.param('providerId') }),
}))
app.post('/api/auth/dev-login', () => devLogin())
app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))
app.all('/api/auth/*', (c) => c.json({ error: 'Method not allowed' }, 405))
// Three segments after /api cannot collide with the existing platform/version API.
app.route('/api/_ui/v1', dashboard)
app.all('/api/_ui/v1/*', (c) => c.json({ error: 'Not found' }, 404))
app.get('/api/schemas', (c) => schemas.GET(c.req.raw))
app.all('/api/schemas', (c) => c.json({ error: 'Method not allowed' }, 405))
// The existing handlers decode raw path parameters exactly once.
function rawParams(path: string) {
  const [, , platform, version] = path.split('/')
  return Promise.resolve({ platform, version })
}
app.get('/api/:platform/versions', (c) => versions.GET(c.req.raw, { params: rawParams(c.req.path) }))
app.post('/api/:platform/versions', (c) => versions.POST(c.req.raw, { params: rawParams(c.req.path) }))
app.all('/api/:platform/versions', (c) => c.json({ error: 'Method not allowed' }, 405))
app.get('/api/:platform/:version', (c) => version.GET(c.req.raw, { params: rawParams(c.req.path) }))
app.all('/api/:platform/:version', (c) => c.json({ error: 'Method not allowed' }, 405))
app.get('/api/:platform', (c) => platform.GET(c.req.raw, { params: rawParams(c.req.path) }))
app.post('/api/:platform', (c) => platform.POST(c.req.raw, { params: rawParams(c.req.path) }))
app.all('/api/:platform', (c) => c.json({ error: 'Method not allowed' }, 405))
app.all('/api/*', (c) => c.json({ error: 'Not found' }, 404))
app.all('/api', (c) => c.json({ error: 'Not found' }, 404))
