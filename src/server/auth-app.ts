import { Hono } from 'hono'
import { auth, oidcSettings } from '@/lib/auth'
import { POST as backchannelLogout } from '@/server/routes/backchannel-logout'
import * as oauthCallback from '@/server/routes/oauth-callback'
import { POST as devLogin } from '@/server/routes/dev-login'

// This app imports authentication only: Redis/domain routes stay out of the sidecar.
export const authApp = new Hono()
authApp.get('/api/auth/providers', (c) => c.json({
  oidc: oidcSettings ? { label: oidcSettings.displayName } : null,
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  development: process.env.NODE_ENV === 'development',
}))
authApp.post('/api/auth/backchannel-logout', (c) => backchannelLogout(c.req.raw))
authApp.on(['GET', 'POST'], '/api/auth/oauth2/callback/:providerId', (c) => oauthCallback.GET(c.req.raw, {
  params: Promise.resolve({ providerId: c.req.param('providerId') }),
}))
authApp.post('/api/auth/dev-login', () => devLogin())
authApp.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw))
authApp.all('/api/auth/*', (c) => c.json({ error: 'Method not allowed' }, 405))
