import { Effect } from 'effect'

import redis from '@/connections/redis'

/**
 * Wraps a Redis call (or any thenable) in an Effect, handling cases
 * where mocks or certain Redis methods may return undefined instead
 * of a proper Promise.
 */
export const redisCall = <T>(fn: () => T): Effect.Effect<Awaited<T>> =>
  Effect.promise(() => Promise.resolve(fn()) as Promise<Awaited<T>>)

/**
 * Reads the most recently written entry from a Redis sorted set keyed by
 * write timestamp (the storage pattern shared by platforms, schemas, and
 * versions: `zadd(key, Date.now(), JSON.stringify(data))`), and parses it.
 * Returns null when the set is empty, or when the entry is malformed JSON
 * (logged rather than thrown, matching how getPlatformsEffect's list scan
 * treats the same corruption as a skip rather than a hard failure).
 */
export const getLatestFromSortedSet = <T>(
  key: string
): Effect.Effect<T | null> =>
  redisCall(() =>
    redis.zrevrangebyscore(key, '+inf', '-inf', 'LIMIT', 0, 1)
  ).pipe(
    Effect.map(([raw]) => {
      if (!raw) return null
      try {
        return JSON.parse(raw) as T
      } catch (parseError) {
        console.error(`Failed to parse Redis entry for "${key}":`, parseError)
        return null
      }
    })
  )

/**
 * Appends an entry to a Redis sorted set keyed by write timestamp (the same
 * storage pattern read by getLatestFromSortedSet), then trims the set back
 * down to `maxEntries` if the append pushed it over.
 *
 * Every save (platform, schema) appends and nothing ever removed an old
 * entry, so a frequently-edited key grew its zset forever even though reads
 * only ever want the latest entry or, at most, a bounded history window
 * (getSchemaHistoryWithTimestamps defaults to 50). Mirrors the cap
 * lib/auditLog.ts already applies to its own list via ltrim.
 *
 * zremrangebyrank's negative-index form (0, -(maxEntries + 1)) only behaves
 * correctly once the set is already over the cap - below it, the resolved
 * stop index clamps to 0 and would delete the single oldest entry instead of
 * nothing. Checking zcard first keeps the trim an explicit "remove exactly
 * the overflow" call instead of relying on that clamping edge case.
 */
export const appendToSortedSet = (
  key: string,
  data: string,
  maxEntries: number
): Effect.Effect<void> =>
  redisCall(async () => {
    await redis.zadd(key, Date.now(), data)
    const count = await redis.zcard(key)
    if (count > maxEntries) {
      await redis.zremrangebyrank(key, 0, count - maxEntries - 1)
    }
  })
