import { Effect } from 'effect'

import redis from '@/connections/redis'
import { redisCall } from '@/lib/effectRedis'
import { getPlatform } from './Platform'

// ── Types ────────────────────────────────────────────────────────────────────

export type Version = {
  content: string
}

// ── Effect-based internals ───────────────────────────────────────────────────

const getVersionsEffect = (
  platformId: string
): Effect.Effect<string[]> =>
  Effect.promise(() => getPlatform(platformId)).pipe(
    Effect.map((platform) => platform?.versions ?? [])
  )

const getVersionEffect = (
  platform: string,
  id: string
): Effect.Effect<Version | null> =>
  redisCall(() =>
    redis.zrevrangebyscore(
      `schemas:${platform}:${id}`,
      '+inf',
      '-inf',
      'LIMIT',
      0,
      1
    )
  ).pipe(
    Effect.map(([version]) => (version ? (JSON.parse(version) as Version) : null))
  )

const saveVersionEffect = (
  platform: string,
  id: string,
  data: Record<string, unknown>
): Effect.Effect<void> =>
  redisCall(() =>
    redis.zadd(
      `${platform}:versions:${id}`,
      Date.now(),
      JSON.stringify(data)
    )
  ).pipe(Effect.asVoid)

// ── Public API (server actions) ──────────────────────────────────────────────

export async function getVersions(platformId: string) {
  'use server'
  return Effect.runPromise(getVersionsEffect(platformId))
}

export async function getVersion(
  platform: string,
  id: string
): Promise<Version | null> {
  'use server'
  return Effect.runPromise(getVersionEffect(platform, id))
}

export async function saveVersion(
  platform: string,
  id: string,
  data: Record<string, unknown>
) {
  'use server'
  return Effect.runPromise(saveVersionEffect(platform, id, data))
}
