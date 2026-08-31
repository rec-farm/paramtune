import { Effect } from 'effect'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/connections/redis')
import mockRedis from '@/connections/__mocks__/redis'

import { getLatestFromSortedSet } from '@/lib/effectRedis'

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
