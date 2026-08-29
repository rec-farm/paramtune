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
 * Returns null when the set is empty.
 */
export const getLatestFromSortedSet = <T>(
  key: string
): Effect.Effect<T | null> =>
  redisCall(() =>
    redis.zrevrangebyscore(key, '+inf', '-inf', 'LIMIT', 0, 1)
  ).pipe(Effect.map(([raw]) => (raw ? (JSON.parse(raw) as T) : null)))
