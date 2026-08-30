import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/connections/redis')
import mockRedis from '@/connections/__mocks__/redis'

import {
  clearPlatformsCache,
  getCachedPlatforms,
  getPlatform,
  getPlatforms,
  savePlatform,
} from '@/models/Platform'

beforeEach(() => {
  vi.clearAllMocks()
  clearPlatformsCache()
})

describe('getPlatform', () => {
  it('returns parsed platform when data exists', async () => {
    const stored = { name: 'ios', versions: ['1.0.0', '2.0.0'] }
    mockRedis.zrevrangebyscore.mockResolvedValue([JSON.stringify(stored)])

    const result = await getPlatform('ios')
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

  it('returns null when platform does not exist', async () => {
    mockRedis.zrevrangebyscore.mockResolvedValue([])
    const result = await getPlatform('nonexistent')
    expect(result).toBeNull()
  })
})

describe('getPlatforms', () => {
  it('returns all platforms from Redis scan', async () => {
    mockRedis.scan.mockResolvedValueOnce([
      '0',
      ['platforms:ios', 'platforms:android'],
    ])
    mockRedis.zrevrangebyscore.mockImplementation(
      (key: string) => {
        if (key === 'platforms:ios') {
          return Promise.resolve([
            JSON.stringify({ name: 'ios', versions: ['1.0.0'] }),
          ])
        }
        if (key === 'platforms:android') {
          return Promise.resolve([
            JSON.stringify({ name: 'android', versions: ['2.0.0'] }),
          ])
        }
        return Promise.resolve([])
      }
    )

    const result = await getPlatforms()
    expect(result).toHaveLength(2)
    expect(result.map((p) => p.name)).toContain('ios')
    expect(result.map((p) => p.name)).toContain('android')
  })

  it('returns empty array when no platforms exist', async () => {
    mockRedis.scan.mockResolvedValueOnce(['0', []])
    const result = await getPlatforms()
    expect(result).toEqual([])
  })

  it('handles multi-page scan results', async () => {
    // First scan returns cursor != '0', second scan returns cursor '0'
    mockRedis.scan
      .mockResolvedValueOnce(['42', ['platforms:ios']])
      .mockResolvedValueOnce(['0', ['platforms:android']])

    mockRedis.zrevrangebyscore.mockImplementation(
      (key: string) => {
        if (key === 'platforms:ios') {
          return Promise.resolve([
            JSON.stringify({ name: 'ios', versions: [] }),
          ])
        }
        if (key === 'platforms:android') {
          return Promise.resolve([
            JSON.stringify({ name: 'android', versions: [] }),
          ])
        }
        return Promise.resolve([])
      }
    )

    const result = await getPlatforms()
    expect(result).toHaveLength(2)
    expect(mockRedis.scan).toHaveBeenCalledTimes(2)
  })

  it('logs and skips platforms whose pipeline command errored, keeping the rest', async () => {
    mockRedis.scan.mockResolvedValueOnce([
      '0',
      ['platforms:ios', 'platforms:android'],
    ])
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    mockRedis.zrevrangebyscore.mockImplementation((key: string) => {
      if (key === 'platforms:ios') {
        return Promise.reject(new Error('connection reset'))
      }
      if (key === 'platforms:android') {
        return Promise.resolve([
          JSON.stringify({ name: 'android', versions: ['2.0.0'] }),
        ])
      }
      return Promise.resolve([])
    })

    const result = await getPlatforms()

    expect(result).toEqual([{ name: 'android', versions: ['2.0.0'] }])
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to fetch platform "ios" from Redis pipeline:',
      expect.any(Error)
    )

    consoleErrorSpy.mockRestore()
  })

  it('logs and skips platforms with malformed JSON, keeping the rest', async () => {
    mockRedis.scan.mockResolvedValueOnce([
      '0',
      ['platforms:ios', 'platforms:android'],
    ])
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    mockRedis.zrevrangebyscore.mockImplementation((key: string) => {
      if (key === 'platforms:ios') {
        return Promise.resolve(['not valid json'])
      }
      if (key === 'platforms:android') {
        return Promise.resolve([
          JSON.stringify({ name: 'android', versions: ['2.0.0'] }),
        ])
      }
      return Promise.resolve([])
    })

    const result = await getPlatforms()

    expect(result).toEqual([{ name: 'android', versions: ['2.0.0'] }])
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to parse platform "ios" data from Redis:',
      expect.any(Error)
    )

    consoleErrorSpy.mockRestore()
  })
})

describe('savePlatform', () => {
  it('saves platform data to Redis sorted set', async () => {
    mockRedis.zadd.mockResolvedValue(1)

    await savePlatform('web', { name: 'web', versions: ['1.0.0'] })

    expect(mockRedis.zadd).toHaveBeenCalledWith(
      'platforms:web',
      expect.any(Number),
      JSON.stringify({ name: 'web', versions: ['1.0.0'] })
    )
  })

  it('throws for empty platform ID', async () => {
    await expect(savePlatform('', {})).rejects.toThrow(
      'Platform ID cannot be empty'
    )
  })

  it('throws for whitespace-only platform ID', async () => {
    await expect(savePlatform('   ', {})).rejects.toThrow(
      'Platform ID cannot be empty'
    )
  })
})

describe('getCachedPlatforms', () => {
  it('reflects a platform saved via savePlatform without waiting for the cache TTL to expire', async () => {
    mockRedis.scan.mockResolvedValueOnce(['0', []])
    const before = await getCachedPlatforms()
    expect(before).toEqual([])

    mockRedis.zadd.mockResolvedValue(1)
    await savePlatform('web', { name: 'web', versions: ['1.0.0'] })

    mockRedis.scan.mockResolvedValueOnce(['0', ['platforms:web']])
    mockRedis.zrevrangebyscore.mockResolvedValueOnce([
      JSON.stringify({ name: 'web', versions: ['1.0.0'] }),
    ])
    const after = await getCachedPlatforms()
    expect(after.map((p) => p.name)).toEqual(['web'])
  })
})
