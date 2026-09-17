import { Effect } from 'effect'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/connections/redis')
import mockRedis from '@/connections/__mocks__/redis'

import { getLatestFromSortedSet, appendToSortedSet } from '@/lib/effectRedis'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getLatestFromSortedSet', () => {
  it('returns the parsed entry when one exists', async () => {
    const stored = { name: 'ios', versions: ['1.0.0'] }
    mockRedis.zrevrangebyscore.mockResolvedValue([JSON.stringify(stored)])

    const result = await Effect.runPromise(
      getLatestFromSortedSet('platforms:ios')
    )

    expect(result).toEqual(stored)
    expect(mockRedis.zrevrangebyscore).toHaveBeenCalledWith(
      'platforms:ios',
      '+inf',
      '-inf',
      'LIMIT',
      0,
      1
    )
  })

  it('returns null when the set is empty', async () => {
    mockRedis.zrevrangebyscore.mockResolvedValue([])

    const result = await Effect.runPromise(
      getLatestFromSortedSet('platforms:missing')
    )

    expect(result).toBeNull()
  })

  it('logs and returns null instead of throwing on malformed JSON', async () => {
    mockRedis.zrevrangebyscore.mockResolvedValue(['not valid json'])
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const result = await Effect.runPromise(
      getLatestFromSortedSet('platforms:corrupted')
    )

    expect(result).toBeNull()
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to parse Redis entry for "platforms:corrupted":',
      expect.any(Error)
    )

    consoleErrorSpy.mockRestore()
  })
})

describe('appendToSortedSet', () => {
  it('adds the entry and does not trim when under the cap', async () => {
    mockRedis.zadd.mockResolvedValue(1)
    mockRedis.zcard.mockResolvedValue(3)

    await Effect.runPromise(
      appendToSortedSet('platforms:ios', JSON.stringify({ v: 1 }), 200)
    )

    expect(mockRedis.zadd).toHaveBeenCalledWith(
      'platforms:ios',
      expect.any(Number),
      JSON.stringify({ v: 1 })
    )
    expect(mockRedis.zremrangebyrank).not.toHaveBeenCalled()
  })

  it('trims exactly the overflow past the cap, oldest first', async () => {
    mockRedis.zadd.mockResolvedValue(1)
    mockRedis.zcard.mockResolvedValue(205)

    await Effect.runPromise(
      appendToSortedSet('platforms:ios', JSON.stringify({ v: 1 }), 200)
    )

    expect(mockRedis.zremrangebyrank).toHaveBeenCalledWith(
      'platforms:ios',
      0,
      4
    )
  })

  it('does not trim when the count lands exactly on the cap', async () => {
    mockRedis.zadd.mockResolvedValue(1)
    mockRedis.zcard.mockResolvedValue(200)

    await Effect.runPromise(
      appendToSortedSet('platforms:ios', JSON.stringify({ v: 1 }), 200)
    )

    expect(mockRedis.zremrangebyrank).not.toHaveBeenCalled()
  })
})
