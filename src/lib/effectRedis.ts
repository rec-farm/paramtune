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
