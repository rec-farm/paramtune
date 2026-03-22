import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/connections/redis', () => {
  return {
    default: {
      get: vi.fn(),
      set: vi.fn(),
      del: vi.fn(),
      scan: vi.fn(),
      smembers: vi.fn(),
      zrevrangebyscore: vi.fn(),
      zadd: vi.fn(),
      sadd: vi.fn(),
      mget: vi.fn()
    }
  }
})

import { validateSchemaContent } from '@/models/Schema'
import redis from '@/connections/redis'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

beforeEach(() => {
  vi.clearAllMocks()

  const mockRedis = redis as any
  mockRedis.scan.mockImplementation(async () => {
    return ['0', [
      'platforms:platform1',
      'platforms:platform2',
      'platforms:platform3',
      'platforms:platform4',
      'platforms:platform5'
    ]]
  });

  mockRedis.mget.mockImplementation(async (keys: string[]) => {
    return keys.map((key) => {
      const name = key.split(':')[1]
      return JSON.stringify({ name, versions: ['1.0.0'] })
    })
  });

  mockRedis.zrevrangebyscore.mockImplementation(async (key: string) => {
    const name = key.split(':')[1]
    return [JSON.stringify({ name, versions: ['1.0.0'] })]
  })
})


describe('validateSchemaContent Performance', () => {
  it('measures execution time for concurrent dependencies', async () => {
    const dependencies = [
      'platform1/1.0.0',
      'platform2/1.0.0',
      'platform3/1.0.0',
      'platform4/1.0.0',
      'platform5/1.0.0'
    ]

    const content: Record<string, unknown> = {}
    dependencies.forEach((dep, index) => {
      content[`prop${index}`] = { '@extends': dep }
    })

    // Simulate I/O delay in Redis calls
    const mockRedis = redis as any
    mockRedis.scan.mockImplementation(async () => {
      await delay(50)
      return ['0', [
        'platforms:platform1',
        'platforms:platform2',
        'platforms:platform3',
        'platforms:platform4',
        'platforms:platform5'
      ]]
    })

    // Add delays for other redis operations if any
    const originalZrevrange = mockRedis.zrevrangebyscore.getMockImplementation()
    mockRedis.zrevrangebyscore.mockImplementation(async (key: string) => {
        await delay(50)
        return originalZrevrange(key)
    })

    const start = performance.now()
    const result = await validateSchemaContent(content)
    const end = performance.now()

    console.log(`Execution time: ${end - start} ms`)
    console.log('Valid:', result.valid, 'Errors:', result.errors)
    expect(result.valid).toBe(true)
  })
})
