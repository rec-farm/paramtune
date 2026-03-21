import { Effect } from 'effect'

/**
 * Wraps a Redis call (or any thenable) in an Effect, handling cases
 * where mocks or certain Redis methods may return undefined instead
 * of a proper Promise.
 */
export const redisCall = <T>(fn: () => T): Effect.Effect<Awaited<T>> =>
  Effect.promise(() => Promise.resolve(fn()) as Promise<Awaited<T>>)
