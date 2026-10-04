import { Hono } from 'hono'
import { createHash } from 'node:crypto'
import { HTTPException } from 'hono/http-exception'
import { auth } from '@/lib/auth'
import { getPlatform, getPlatforms, savePlatform } from '@/models/Platform'
import { getSchema, getSchemaHistoryWithTimestamps, compareSchemasWithContent } from '@/models/Schema'
import { isValidName, isValidVersionName } from '@/lib/nameValidation'
import { createPlatformVersion } from '@/server/services/createVersion'
import { saveSchemaContent } from '@/server/services/saveSchema'
import { validateSchemaContent } from '@/server/services/validateSchema'
import { logAudit } from '@/lib/auditLog'
import type { Overview, SchemaDetail } from '@/shared/contracts'

function name(value: unknown, version = false): string {
  if (typeof value !== 'string' || !(version ? isValidVersionName(value) : isValidName(value))) {
    throw new HTTPException(400, { message: `Invalid ${version ? 'version' : 'platform'} name` })
  }
  return value
}

async function body(request: Request): Promise<Record<string, unknown>> {
  const data: unknown = await request.json().catch(() => null)
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new HTTPException(400, { message: 'Body must be a JSON object' })
  }
  return data as Record<string, unknown>
}

function content(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new HTTPException(400, { message: 'Schema content must be a JSON object' })
  }
  return data as Record<string, unknown>
}

export const dashboard = new Hono()

dashboard.use('*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: 'Unauthorized' }, 401)
  await next()
})

dashboard.get('/overview', async (c) => {
  const platforms = await getPlatforms()
  const results = await Promise.allSettled(platforms.flatMap((platform) =>
    platform.versions.map(async (version) => {
      const [latest] = await getSchemaHistoryWithTimestamps(platform.name, version, 1)
      return {
        platform: platform.name, version, savedAt: latest?.timestamp,
        author: latest?.author?.name,
        hasContent: Object.keys(latest?.content ?? {}).length > 0,
      }
    })
  ))
  const statuses = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : [])
  return c.json({ platforms, statuses, failed: results.length - statuses.length } satisfies Overview)
})

dashboard.post('/platforms', async (c) => {
  const data = await body(c.req.raw)
  const platform = name(typeof data.name === 'string' ? data.name.trim() : data.name)
  if (await getPlatform(platform)) return c.json({ error: 'Platform already exists' }, 409)
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: 'Unauthorized' }, 401)
  await savePlatform(platform, { name: platform, versions: [] })
  await logAudit({ action: 'create', platform, userId: session.user.id, userEmail: session.user.email })
  return c.json({ ok: true }, 201)
})

dashboard.post('/platforms/:platform/versions', async (c) => {
  const data = await body(c.req.raw)
  await createPlatformVersion(c.req.raw.headers, name(c.req.param('platform')), name(data.version, true))
  return c.json({ ok: true }, 201)
})

dashboard.get('/platforms/:platform/versions/:version/schema', async (c) => {
  const platform = name(c.req.param('platform'))
  const version = name(c.req.param('version'), true)
  const existing = await getPlatform(platform)
  if (!existing?.versions.includes(version)) return c.json({ error: 'Version not found' }, 404)
  const [schema, history] = await Promise.all([
    getSchema(platform, version), getSchemaHistoryWithTimestamps(platform, version),
  ])
  const contentHash = createHash('sha256').update(JSON.stringify(schema?.content || {})).digest('hex')
  return c.json({ schema, history, contentHash } satisfies SchemaDetail)
})

dashboard.put('/platforms/:platform/versions/:version/schema', async (c) => {
  const data = await body(c.req.raw)
  const platform = name(c.req.param('platform'))
  const version = name(c.req.param('version'), true)
  const existing = await getPlatform(platform)
  if (!existing?.versions.includes(version)) return c.json({ error: 'Version not found' }, 404)
  await saveSchemaContent(c.req.raw.headers, platform, version, content(data.content))
  return c.json({ ok: true })
})

dashboard.post('/validate', async (c) => {
  const data = await body(c.req.raw)
  return c.json(await validateSchemaContent(c.req.raw.headers, content(data.content)))
})

dashboard.post('/compare', async (c) => {
  const data = await body(c.req.raw)
  return c.json(await compareSchemasWithContent(
    name(data.platformA), name(data.versionA, true), name(data.platformB), name(data.versionB, true)
  ))
})
