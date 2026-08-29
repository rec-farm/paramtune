import { Effect } from 'effect'

import { getLatestFromSortedSet } from '@/lib/effectRedis'
import { getPlatform } from './Platform'
import { getKey } from './Schema'

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
  getLatestFromSortedSet<Version>(getKey(platform, id))

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
