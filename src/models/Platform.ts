import { Effect, Data } from 'effect'

import redis from '@/connections/redis'
import { redisCall, getLatestFromSortedSet } from '@/lib/effectRedis'

// ── Error types ──────────────────────────────────────────────────────────────

export class EmptyPlatformIdError extends Data.TaggedError(
  'EmptyPlatformIdError'
)<{}> {
  get message() {
    return 'Platform ID cannot be empty'
  }
}

export class EmptyPlatformNameError extends Data.TaggedError(
  'EmptyPlatformNameError'
)<{}> {
  get message() {
    return 'Platform name is required'
  }
}

export class MissingPlatformError extends Data.TaggedError(
  'MissingPlatformError'
)<{
  readonly platform: string
}> {
  get message() {
    return `Platform "${this.platform}" not found`
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export type Platform = {
  name: string
  versions: string[]
}

// ── In-process cache ────────────────────────────────────────────────────────
// Invalidated on every successful savePlatform() so reads never see a stale
// list right after a write; a short TTL still limits Redis scans otherwise.

let cachedPlatforms: Platform[] | null = null
let cachedPlatformsTime = 0
const PLATFORMS_CACHE_TTL = 5000 // 5 seconds

export async function getCachedPlatforms(): Promise<Platform[]> {
  const now = Date.now()
  if (cachedPlatforms && now - cachedPlatformsTime < PLATFORMS_CACHE_TTL) {
    return cachedPlatforms
  }
  const platforms = await getPlatforms()
  cachedPlatforms = platforms
  cachedPlatformsTime = now
  return platforms
}

export function clearPlatformsCache() {
  cachedPlatforms = null
  cachedPlatformsTime = 0
}

// ── Effect-based internals ───────────────────────────────────────────────────

const getPlatformEffect = (id: string): Effect.Effect<Platform | null> =>
  getLatestFromSortedSet<Platform>(`platforms:${id}`)

const getPlatformsEffect: Effect.Effect<Platform[]> = Effect.gen(function* () {
  const platforms: string[] = []
  let cursor = '0'

  do {
    const [nextCursor, keys] = yield* redisCall(() =>
      redis.scan(cursor, 'MATCH', 'platforms:*')
    )
    cursor = nextCursor
    platforms.push(
      ...keys
        .map((key) => key.split(':')[1])
        .filter((name) => name && name.trim() !== '')
    )
  } while (cursor !== '0')

  if (platforms.length === 0) {
    return []
  }

  const pipeline = redis.pipeline()
  platforms.forEach((id) => {
    pipeline.zrevrangebyscore(`platforms:${id}`, '+inf', '-inf', 'LIMIT', 0, 1)
  })

  const results = yield* redisCall(() => pipeline.exec())

  if (!results) {
    return []
  }

  const parsedPlatforms = results
    .map(([err, result], index) => {
      if (err) {
        console.error(
          `Failed to fetch platform "${platforms[index]}" from Redis pipeline:`,
          err
        )
        return null
      }
      if (!result || !Array.isArray(result) || result.length === 0) {
        return null
      }
      try {
        return JSON.parse(result[0] as string) as Platform
      } catch (parseError) {
        console.error(
          `Failed to parse platform "${platforms[index]}" data from Redis:`,
          parseError
        )
        return null
      }
    })
    .filter((p): p is Platform => Boolean(p))

  return parsedPlatforms
})

const savePlatformEffect = (
  id: string,
  data: Record<string, unknown>
): Effect.Effect<void, EmptyPlatformIdError> =>
  Effect.gen(function* () {
    if (!id || id.trim() === '') {
      return yield* new EmptyPlatformIdError()
    }

    yield* redisCall(() =>
      redis.zadd(`platforms:${id}`, Date.now(), JSON.stringify(data))
    )
  })

// ── Public API ───────────────────────────────────────────────────────────────
// Plain server-side functions, not Server Actions: they must stay callable
// only from already-authenticated code paths (API routes via requireSession,
// dashboard pages via requireDashboardSession). A `'use server'` directive on
// any of these would turn it into a standalone, publicly invocable endpoint
// with none of those checks — see src/lib/dashboardAuth.ts for why that
// distinction matters here.

export async function getPlatforms(): Promise<Platform[]> {
  return Effect.runPromise(getPlatformsEffect)
}

export async function getPlatform(id: string): Promise<Platform | null> {
  return Effect.runPromise(getPlatformEffect(id))
}

export async function savePlatform(
  id: string,
  data: Record<string, unknown>
) {
  const result = await Effect.runPromise(savePlatformEffect(id, data))
  clearPlatformsCache()
  return result
}
