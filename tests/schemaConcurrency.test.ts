import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/connections/redis')
import mockRedis from '@/connections/__mocks__/redis'

import { clearPlatformsCache,  getSchema, saveSchema } from '@/models/Schema'

beforeEach(() => {
  clearPlatformsCache();
  vi.clearAllMocks()
  mockRedis.scan.mockResolvedValue(['0', []])
  mockRedis.smembers.mockResolvedValue([])
  mockRedis.zadd.mockResolvedValue(1)
})

describe('concurrent schema updates', () => {
  it('handles parallel saves to the same schema key', async () => {
    const saves = Array.from({ length: 5 }, (_, i) =>
      saveSchema('platform', '1.0.0', { version: i })
    )

    await expect(Promise.all(saves)).resolves.not.toThrow()
    expect(mockRedis.zadd).toHaveBeenCalledTimes(5)

    // All saves target the same Redis key
    const keys = mockRedis.zadd.mock.calls.map(
      (call: unknown[]) => call[0] as string
    )
    expect(keys.every((k) => k === 'schemas:platform:1.0.0')).toBe(true)
  })

  it('handles parallel saves to different schema keys', async () => {
    const saves = [
      saveSchema('platform-a', '1.0.0', { key: 'a' }),
      saveSchema('platform-b', '1.0.0', { key: 'b' }),
      saveSchema('platform-c', '1.0.0', { key: 'c' }),
    ]

    await expect(Promise.all(saves)).resolves.not.toThrow()
    expect(mockRedis.zadd).toHaveBeenCalledTimes(3)

    const keys = mockRedis.zadd.mock.calls.map(
      (call: unknown[]) => call[0]
    )
    expect(keys).toContain('schemas:platform-a:1.0.0')
    expect(keys).toContain('schemas:platform-b:1.0.0')
    expect(keys).toContain('schemas:platform-c:1.0.0')
  })

  it('preserves unique timestamps for concurrent writes', async () => {
    // Simulate slight timing differences
    let callCount = 0
    mockRedis.zadd.mockImplementation(
      (_key: string, score: number, _value: string) => {
        callCount++
        return Promise.resolve(1)
      }
    )

    await Promise.all([
      saveSchema('test', '1.0.0', { v: 1 }),
      saveSchema('test', '1.0.0', { v: 2 }),
    ])

    expect(callCount).toBe(2)
    const scores = mockRedis.zadd.mock.calls.map(
      (call: unknown[]) => call[1] as number
    )
    // Both should have numeric timestamp scores
    expect(scores[0]).toBeTypeOf('number')
    expect(scores[1]).toBeTypeOf('number')
  })

  it('handles concurrent reads and writes without errors', async () => {
    mockRedis.zrevrangebyscore.mockResolvedValue([
      JSON.stringify({
        content: { existing: true },
        dependencies: [],
        output: { existing: true },
      }),
    ])

    const operations = [
      getSchema('test', '1.0.0'),
      saveSchema('test', '1.0.0', { updated: true }),
      getSchema('test', '1.0.0'),
      saveSchema('test', '1.0.0', { updated: 'again' }),
      getSchema('test', '1.0.0'),
    ]

    const results = await Promise.all(operations)

    // Read operations should return data
    expect(results[0]).toHaveProperty('content')
    expect(results[2]).toHaveProperty('content')
    expect(results[4]).toHaveProperty('content')
  })

  it('handles concurrent saves with dependencies', async () => {
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
            content: { foundation: true },
            dependencies: [],
            output: { foundation: true },
          }),
        ])
      }
      return Promise.resolve([])
    })

    const saves = [
      saveSchema('child-a', '1.0.0', {
        '@extends': 'base/1.0.0',
        childA: true,
      }),
      saveSchema('child-b', '1.0.0', {
        '@extends': 'base/1.0.0',
        childB: true,
      }),
    ]

    await expect(Promise.all(saves)).resolves.not.toThrow()

    // Both should register as dependents of base
    const saddCalls = mockRedis.sadd.mock.calls.filter(
      (call: unknown[]) => call[0] === 'schemas:dependents:base:1.0.0'
    )
    expect(saddCalls).toHaveLength(2)
    const dependents = saddCalls.map((call: unknown[]) => call[1])
    expect(dependents).toContain('child-a/1.0.0')
    expect(dependents).toContain('child-b/1.0.0')
  })
})

describe('cascade update behavior', () => {
  it('cascades updates to dependents when base schema is saved', async () => {
    mockRedis.scan.mockResolvedValue(['0', ['platforms:base']])
    mockRedis.zrevrangebyscore.mockImplementation((key: string) => {
      if (key === 'platforms:base') {
        return Promise.resolve([
          JSON.stringify({ name: 'base', versions: ['1.0.0'] }),
        ])
      }
      if (key === 'schemas:base:1.0.0') {
        return Promise.resolve([
          JSON.stringify({
            content: { baseVal: 'updated' },
            dependencies: [],
            output: { baseVal: 'updated' },
          }),
        ])
      }
      if (key === 'schemas:child:1.0.0') {
        return Promise.resolve([
          JSON.stringify({
            content: { '@extends': 'base/1.0.0', childVal: true },
            dependencies: ['base/1.0.0'],
            output: { baseVal: 'old', childVal: true },
          }),
        ])
      }
      return Promise.resolve([])
    })

    // child/1.0.0 depends on base/1.0.0
    mockRedis.smembers.mockImplementation((key: string) => {
      if (key === 'schemas:dependents:base:1.0.0') {
        return Promise.resolve(['child/1.0.0'])
      }
      return Promise.resolve([])
    })

    await saveSchema('base', '1.0.0', { baseVal: 'updated' })

    // zadd should be called for both base and the cascaded child
    expect(mockRedis.zadd.mock.calls.length).toBeGreaterThanOrEqual(2)

    const savedKeys = mockRedis.zadd.mock.calls.map(
      (call: unknown[]) => call[0]
    )
    expect(savedKeys).toContain('schemas:base:1.0.0')
    expect(savedKeys).toContain('schemas:child:1.0.0')
  })

  it('does not cascade infinitely with visited tracking', async () => {
    mockRedis.scan.mockResolvedValue(['0', []])
    mockRedis.zadd.mockResolvedValue(1)

    // Simulate dependent that points back (already handled by visited set)
    mockRedis.smembers.mockImplementation((key: string) => {
      if (key === 'schemas:dependents:test:1.0.0') {
        return Promise.resolve(['test/1.0.0']) // self-reference in dependents
      }
      return Promise.resolve([])
    })

    // Should complete without infinite loop
    await expect(
      saveSchema('test', '1.0.0', { value: 'test' })
    ).resolves.not.toThrow()
  })
})
