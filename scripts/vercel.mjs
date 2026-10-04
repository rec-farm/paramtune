import { cp, mkdir, rm, writeFile } from 'node:fs/promises'

// Vercel hosts the frontend; the Node API retains its persistent SQLite volume.
const configured = process.env.PARAMTUNE_API_ORIGIN
if (!configured) throw new Error('Set PARAMTUNE_API_ORIGIN to the persistent Node backend origin before deploying the Vercel frontend')
const backend = new URL(configured)
if (backend.protocol !== 'https:' || backend.username || backend.password || backend.pathname !== '/' || backend.search || backend.hash) {
  throw new Error('PARAMTUNE_API_ORIGIN must be an HTTPS origin without a path or credentials')
}
// Remove stale generated routes/functions when switching from another builder.
await rm('.vercel/output', { recursive: true, force: true })
await mkdir('.vercel/output', { recursive: true })
await cp('dist/client', '.vercel/output/static', { recursive: true })
await writeFile('.vercel/output/config.json', JSON.stringify({
  version: 3,
  routes: [
    { src: '/(.*)', headers: { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'X-Frame-Options': 'SAMEORIGIN' }, continue: true },
    { src: '/api(?:/(.*))?$', dest: `${backend.origin}/api/$1` },
    { src: '/healthz', dest: `${backend.origin}/healthz` },
    { src: '/assets/(.*)', headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }, continue: true },
    { src: '/api-docs/?', dest: '/api-docs/index.html' },
    { handle: 'filesystem' },
    { src: '/(?:login|dashboard(?:/[^/]+){0,2})/?', dest: '/app.html', headers: { 'Cache-Control': 'no-store' } },
    { src: '/(.*)', dest: '/app.html', status: 404 },
  ],
}, null, 2))
