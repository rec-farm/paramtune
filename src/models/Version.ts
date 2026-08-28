import { Effect } from 'effect'

import redis from '@/connections/redis'
import { redisCall } from '@/lib/effectRedis'
import { getPlatform } from './Platform'
import { getKey } from './Schema'
import type { Schema } from './Schema'

// ── Types ────────────────────────────────────────────────────────────────────

// A version is stored as, and returned verbatim from, the same JSON a Schema save
// writes to Redis (see saveSchemaEffect in Schema.ts) — same shape, different name.
export type Version = Schema

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
      getKey(platform, id),
      '+inf',
      '-inf',
      'LIMIT',
      0,
      1
    )
  ).pipe(
    Effect.map(([version]) => (version ? (JSON.parse(version) as Version) : null))
  )

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
