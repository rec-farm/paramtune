import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockRedis = vi.hoisted(() => {
  const zrevrangebyscore = vi.fn()
  const zadd = vi.fn()
  const sadd = vi.fn()
  const smembers = vi.fn()
  const scan = vi.fn()



  const pipeline = vi.fn(function() {
    const pipelineCommands: { command: string; args: any[] }[] = []
    return {

    zrevrangebyscore: function(...args: any[]) {
      pipelineCommands.push({ command: 'zrevrangebyscore', args })
      return this
    },
    exec: async function() {
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
      pipelineCommands.length = 0
      return results
    },
  }})

  return {
    zrevrangebyscore,
    zadd,
    sadd,
    smembers,
    scan,
    pipeline,
  }
})

vi.mock('@/connections/redis', () => ({
  default: mockRedis,
}))

import { clearPlatformsCache,  getSchema, saveSchema, getSchemaHistoryWithTimestamps } from '@/models/Schema'
import { getPlatform, getPlatforms, savePlatform } from '@/models/Platform'

beforeEach(() => {
  clearPlatformsCache();
  vi.clearAllMocks()
  mockRedis.scan.mockResolvedValue(['0', []])
  mockRedis.smembers.mockResolvedValue([])
})

describe('schema persistence round-trip', () => {
  it('data saved with saveSchema can be retrieved with getSchema', async () => {
    const content = { feature: { enabled: true, config: { timeout: 5000 } } }
    const author = { id: 'user-1', name: 'Test User', image: 'avatar.png' }

    let storedData: string | null = null
    mockRedis.zadd.mockImplementation(
      (_key: string, _score: number, data: string) => {
        storedData = data
        return Promise.resolve(1)
      }
    )

    await saveSchema('platform', '1.0.0', content, author)

    // Simulate retrieval returning what was stored
    mockRedis.zrevrangebyscore.mockResolvedValue([storedData!])
    const result = await getSchema('platform', '1.0.0')

    expect(result).toHaveProperty('content')
    expect(result).toHaveProperty('dependencies')
    expect(result).toHaveProperty('output')
    expect(result).toHaveProperty('author')
    expect((result as { content: Record<string, unknown> }).content).toEqual(content)
    expect((result as { author: { id: string } }).author).toEqual(author)
  })

  it('preserves all schema fields through save/load cycle', async () => {
    const content = {
      string: 'hello',
      number: 42,
      boolean: true,
      nested: { a: { b: 'deep' } },
      array: [1, 2, 3],
    }

    let storedJson: string | null = null
    mockRedis.zadd.mockImplementation(
      (_key: string, _score: number, data: string) => {
        storedJson = data
        return Promise.resolve(1)
      }
    )

    await saveSchema('test', '1.0.0', content)

    // Verify the stored JSON is valid and preserves structure
    const parsed = JSON.parse(storedJson!)
    expect(parsed.content).toEqual(content)
    expect(parsed.output).toEqual(content)
    expect(parsed.dependencies).toEqual([])
  })

  it('stores schemas as timestamped entries in sorted set', async () => {
    mockRedis.zadd.mockResolvedValue(1)

    const beforeSave = Date.now()
    await saveSchema('test', '1.0.0', { v: 1 })
    const afterSave = Date.now()

    const [, score] = mockRedis.zadd.mock.calls[0] as [string, number, string]
    expect(score).toBeGreaterThanOrEqual(beforeSave)
    expect(score).toBeLessThanOrEqual(afterSave)
  })
})

describe('platform persistence round-trip', () => {
  it('data saved with savePlatform can be retrieved with getPlatform', async () => {
    const platformData = { name: 'web', versions: ['1.0.0', '2.0.0'] }

    let storedData: string | null = null
    mockRedis.zadd.mockImplementation(
      (_key: string, _score: number, data: string) => {
        storedData = data
        return Promise.resolve(1)
      }
    )

    await savePlatform('web', platformData)

    mockRedis.zrevrangebyscore.mockResolvedValue([storedData!])
    const result = await getPlatform('web')

    expect(result).toEqual(platformData)
  })

  it('uses correct Redis key pattern for platforms', async () => {
    mockRedis.zadd.mockResolvedValue(1)

    await savePlatform('my-app', { name: 'my-app', versions: [] })

    expect(mockRedis.zadd).toHaveBeenCalledWith(
      'platforms:my-app',
      expect.any(Number),
      expect.any(String)
    )
  })

  it('scans with correct pattern to discover all platforms', async () => {
    mockRedis.scan.mockResolvedValueOnce(['0', []])

    await getPlatforms()

    expect(mockRedis.scan).toHaveBeenCalledWith('0', 'MATCH', 'platforms:*')
  })
})

describe('schema history persistence', () => {
  it('retrieves multiple historical entries ordered by timestamp', async () => {
    const entries = [
      { content: { v: 3 }, dependencies: [], output: { v: 3 }, author: { id: 'u3', name: 'User 3' } },
      { content: { v: 2 }, dependencies: [], output: { v: 2 } },
      { content: { v: 1 }, dependencies: [], output: { v: 1 }, author: { id: 'u1', name: 'User 1' } },
    ]

    // Redis returns [data, score, data, score, ...] with WITHSCORES
    mockRedis.zrevrangebyscore.mockResolvedValue([
      JSON.stringify(entries[0]), '3000',
      JSON.stringify(entries[1]), '2000',
      JSON.stringify(entries[2]), '1000',
    ])

    const history = await getSchemaHistoryWithTimestamps('plat', '1.0.0')

    expect(history).toHaveLength(3)
    expect(history[0].timestamp).toBe(3000)
    expect(history[0].content).toEqual({ v: 3 })
    expect(history[0].author).toEqual({ id: 'u3', name: 'User 3' })
    expect(history[1].timestamp).toBe(2000)
    expect(history[1].author).toBeUndefined()
    expect(history[2].timestamp).toBe(1000)
  })

  it('respects limit parameter for history retrieval', async () => {
    mockRedis.zrevrangebyscore.mockResolvedValue([])

    await getSchemaHistoryWithTimestamps('plat', '1.0.0', 10)

    expect(mockRedis.zrevrangebyscore).toHaveBeenCalledWith(
      'schemas:plat:1.0.0',
      '+inf',
      '-inf',
      'WITHSCORES',
      'LIMIT',
      0,
      10
    )
  })

  it('uses default limit of 50 when not specified', async () => {
    mockRedis.zrevrangebyscore.mockResolvedValue([])

    await getSchemaHistoryWithTimestamps('plat', '1.0.0')

    expect(mockRedis.zrevrangebyscore).toHaveBeenCalledWith(
      'schemas:plat:1.0.0',
      '+inf',
      '-inf',
      'WITHSCORES',
      'LIMIT',
      0,
      50
    )
  })
})

describe('dependency persistence', () => {
  it('persists dependency references in Redis set', async () => {
    mockRedis.scan.mockResolvedValue([
      '0',
      ['platforms:base'],
    ])
    mockRedis.zrevrangebyscore.mockImplementation((key: string) => {
      if (key === 'platforms:base') {
        return Promise.resolve([
          JSON.stringify({ name: 'base', versions: ['1.0.0'] }),
        ])
      }
      if (key === 'schemas:base:1.0.0') {
        return Promise.resolve([
          JSON.stringify({
            content: { val: 1 },
            dependencies: [],
            output: { val: 1 },
          }),
        ])
      }
      return Promise.resolve([])
    })
    mockRedis.zadd.mockResolvedValue(1)

    await saveSchema('child', '2.0.0', {
      '@extends': 'base/1.0.0',
      extra: true,
    })

    expect(mockRedis.sadd).toHaveBeenCalledWith(
      'schemas:dependents:base:1.0.0',
      'child/2.0.0'
    )
  })

  it('stores dependencies array in the schema JSON', async () => {
    mockRedis.scan.mockResolvedValue([
      '0',
      ['platforms:dep-target'],
    ])
    mockRedis.zrevrangebyscore.mockImplementation((key: string) => {
      if (key === 'platforms:dep-target') {
        return Promise.resolve([
          JSON.stringify({ name: 'dep-target', versions: ['1.0.0'] }),
        ])
      }
      if (key === 'schemas:dep-target:1.0.0') {
        return Promise.resolve([
          JSON.stringify({
            content: { base: true },
            dependencies: [],
            output: { base: true },
          }),
        ])
      }
      return Promise.resolve([])
    })
    mockRedis.zadd.mockResolvedValue(1)

    await saveSchema('consumer', '1.0.0', {
      '@extends': 'dep-target/1.0.0',
      own: 'data',
    })

    const savedJson = mockRedis.zadd.mock.calls[0][2] as string
    const savedData = JSON.parse(savedJson)
    expect(savedData.dependencies).toContain('dep-target/1.0.0')
  })
})

describe('Redis sorted set key structure', () => {
  it('uses schemas:{platform}:{version} key for schema data', async () => {
    mockRedis.zrevrangebyscore.mockResolvedValue([])

    await getSchema('my-app', '2.1.0')

    expect(mockRedis.zrevrangebyscore).toHaveBeenCalledWith(
      'schemas:my-app:2.1.0',
      '+inf',
      '-inf',
      'LIMIT',
      0,
      1
    )
  })

  it('uses platforms:{name} key for platform data', async () => {
    mockRedis.zrevrangebyscore.mockResolvedValue([])

    await getPlatform('web-app')

    expect(mockRedis.zrevrangebyscore).toHaveBeenCalledWith(
      'platforms:web-app',
      '+inf',
      '-inf',
      'LIMIT',
      0,
      1
    )
  })

  it('handles platform names with special characters', async () => {
    mockRedis.zadd.mockResolvedValue(1)

    await savePlatform('my-app_v2', { name: 'my-app_v2', versions: [] })

    expect(mockRedis.zadd).toHaveBeenCalledWith(
      'platforms:my-app_v2',
      expect.any(Number),
      expect.any(String)
    )
  })
})
