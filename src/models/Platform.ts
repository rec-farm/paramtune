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

  const results = yield* Effect.all(
    platforms.map((id) => getPlatformEffect(id))
  )
  return results.filter((p): p is Platform => Boolean(p))
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
