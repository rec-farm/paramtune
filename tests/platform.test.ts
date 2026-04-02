import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockRedis = vi.hoisted(() => {
  const zrevrangebyscore = vi.fn()
  const zadd = vi.fn()
  const scan = vi.fn()

  // Create a proper mock for the pipeline


  const pipeline = vi.fn(function() {
    const pipelineCommands: { command: string; args: any[] }[] = []
    return {

    zrevrangebyscore: function(...args: any[]) {
      pipelineCommands.push({ command: 'zrevrangebyscore', args })
      return this
    },
    exec: async function() {
      // Execute each queued command using the existing mocked functions
      // ioredis pipeline results look like: [[error1, result1], [error2, result2]]
      const results = await Promise.all(
        pipelineCommands.map(async (cmd) => {
          if (cmd.command === 'zrevrangebyscore') {
            try {
              const res = await zrevrangebyscore(...cmd.args)
              return [null, res]
            } catch (err) {
              return [err, null]
            }
          }
          return [new Error('Command not mocked in pipeline'), null]
        })
      )
      // Clear the commands queue after exec
      pipelineCommands.length = 0
      return results
    }
  }})

  return {
    zrevrangebyscore,
    zadd,
    scan,
    pipeline,
  }
})

vi.mock('@/connections/redis', () => ({
  default: mockRedis,
}))

import { getPlatform, getPlatforms, savePlatform } from '@/models/Platform'

beforeEach(() => {
  vi.clearAllMocks()
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
