import { Effect } from 'effect'

import { getLatestFromSortedSet } from '@/lib/effectRedis'
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
  getLatestFromSortedSet<Version>(getKey(platform, id))

// ── Public API ───────────────────────────────────────────────────────────────
// Plain server-side functions, not Server Actions — see the note in
// src/models/Platform.ts for why a `'use server'` directive doesn't belong here.

export async function getVersions(platformId: string) {
  return Effect.runPromise(getVersionsEffect(platformId))
}

export async function getVersion(
  platform: string,
  id: string
): Promise<Version | null> {
  return Effect.runPromise(getVersionEffect(platform, id))
}
