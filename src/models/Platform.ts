import { Effect, Data } from 'effect'

import redis from '@/connections/redis'
import { redisCall } from '@/lib/effectRedis'

// ── Error types ──────────────────────────────────────────────────────────────

export class EmptyPlatformIdError extends Data.TaggedError(
  'EmptyPlatformIdError'
)<{}> {
  get message() {
    return 'Platform ID cannot be empty'
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export type Platform = {
  name: string
  versions: string[]
}

// ── Effect-based internals ───────────────────────────────────────────────────

const getPlatformEffect = (
  id: string
): Effect.Effect<Platform | null> =>
  redisCall(() =>
    redis.zrevrangebyscore(`platforms:${id}`, '+inf', '-inf', 'LIMIT', 0, 1)
  ).pipe(
    Effect.map(([platform]) =>
      platform ? (JSON.parse(platform) as Platform) : null
    )
  )

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
    .map(([err, result]) => {
      if (err || !result || !Array.isArray(result) || result.length === 0) {
        return null
      }
      return JSON.parse(result[0] as string) as Platform
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

// ── Public API (server actions) ──────────────────────────────────────────────

export async function getPlatforms(): Promise<Platform[]> {
  'use server'
  return Effect.runPromise(getPlatformsEffect)
}

export async function getPlatform(id: string): Promise<Platform | null> {
  'use server'
  return Effect.runPromise(getPlatformEffect(id))
}

export async function savePlatform(
  id: string,
  data: Record<string, unknown>
) {
  'use server'
  return Effect.runPromise(savePlatformEffect(id, data))
}
