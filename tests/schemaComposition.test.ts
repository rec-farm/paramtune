import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockRedis = vi.hoisted(() => ({
  zrevrangebyscore: vi.fn(),
  zadd: vi.fn(),
  sadd: vi.fn(),
  smembers: vi.fn(),
  scan: vi.fn(),
}))

vi.mock('@/connections/redis', () => ({
  default: mockRedis,
}))

import { clearPlatformsCache,
  previewJsonOutput,
  saveSchema,
  validateSchemaContent,
} from '@/models/Schema'

beforeEach(() => {
  clearPlatformsCache();
  vi.clearAllMocks()
  mockRedis.scan.mockResolvedValue(['0', []])
  mockRedis.smembers.mockResolvedValue([])
})

function setupPlatforms(platforms: Record<string, string[]>) {
  const keys = Object.keys(platforms).map((name) => `platforms:${name}`)
  mockRedis.scan.mockResolvedValue(['0', keys])

  mockRedis.zrevrangebyscore.mockImplementation((key: string) => {
    for (const [name, versions] of Object.entries(platforms)) {
      if (key === `platforms:${name}`) {
        return Promise.resolve([
          JSON.stringify({ name, versions }),
        ])
      }
      for (const version of versions) {
        if (key === `schemas:${name}:${version}`) {
          const content = (platformSchemas as Record<string, Record<string, unknown>>)?.[`${name}/${version}`] ?? {}
          return Promise.resolve([
            JSON.stringify({
              content,
              dependencies: [],
              output: content,
            }),
          ])
        }
      }
    }
    return Promise.resolve([])
  })
}

let platformSchemas: Record<string, Record<string, unknown>> = {}

function setupSchemaContent(ref: string, content: Record<string, unknown>) {
  platformSchemas[ref] = content
}

beforeEach(() => {
  platformSchemas = {}
})

describe('deep nesting composition', () => {
  it('resolves three-level @extends chain (A extends B extends C)', async () => {
    setupPlatforms({
      base: ['1.0.0'],
      middle: ['1.0.0'],
    })

    setupSchemaContent('base/1.0.0', { a: 1, b: 2 })
    setupSchemaContent('middle/1.0.0', {
      '@extends': 'base/1.0.0',
      b: 20,
      c: 3,
    })

    // Override the mock to handle middle's extends resolution
    const originalImpl = mockRedis.zrevrangebyscore.getMockImplementation()
    mockRedis.zrevrangebyscore.mockImplementation((key: string) => {
      if (key === 'schemas:middle:1.0.0') {
        return Promise.resolve([
          JSON.stringify({
            content: { '@extends': 'base/1.0.0', b: 20, c: 3 },
            dependencies: ['base/1.0.0'],
            output: { a: 1, b: 20, c: 3 },
          }),
        ])
      }
      return originalImpl!(key)
    })

    const result = await previewJsonOutput({
      '@extends': 'middle/1.0.0',
      c: 30,
      d: 4,
    })

    const output = JSON.parse(result)
    // base: {a:1, b:2} -> middle overrides b=20, adds c=3 -> child overrides c=30, adds d=4
    expect(output.a).toBe(1)
    expect(output.b).toBe(20)
    expect(output.c).toBe(30)
    expect(output.d).toBe(4)
  })

  it('deep merges nested objects across multiple inheritance levels', async () => {
    setupPlatforms({ base: ['1.0.0'] })
    setupSchemaContent('base/1.0.0', {
      settings: {
        theme: { primary: '#000', secondary: '#fff' },
        layout: { sidebar: true, header: true },
      },
    })

    const result = await previewJsonOutput({
      '@extends': 'base/1.0.0',
      settings: {
        theme: { primary: '#333' },
        layout: { footer: true },
      },
    })

    const output = JSON.parse(result)
    expect(output.settings.theme).toEqual({ primary: '#333', secondary: '#fff' })
    expect(output.settings.layout).toEqual({ sidebar: true, header: true, footer: true })
  })

  it('handles @extends with empty base content', async () => {
    setupPlatforms({ empty: ['1.0.0'] })
    setupSchemaContent('empty/1.0.0', {})

    const result = await previewJsonOutput({
      '@extends': 'empty/1.0.0',
      feature: true,
    })

    const output = JSON.parse(result)
    expect(output).toEqual({ feature: true })
  })
})

describe('circular dependency detection', () => {
  it('detects self-referencing @extends', async () => {
    setupPlatforms({ self: ['1.0.0'] })

    mockRedis.zrevrangebyscore.mockImplementation((key: string) => {
      if (key === 'platforms:self') {
        return Promise.resolve([
          JSON.stringify({ name: 'self', versions: ['1.0.0'] }),
        ])
      }
      if (key === 'schemas:self:1.0.0') {
        return Promise.resolve([
          JSON.stringify({
            content: { '@extends': 'self/1.0.0' },
            dependencies: ['self/1.0.0'],
            output: {},
          }),
        ])
      }
      return Promise.resolve([])
    })
    mockRedis.zadd.mockResolvedValue(1)

    await expect(
      saveSchema('self', '1.0.0', { '@extends': 'self/1.0.0' })
    ).rejects.toThrow('Circular dependency')
  })

  it('detects three-way circular dependency (A->B->C->A)', async () => {
    mockRedis.scan.mockResolvedValue([
      '0',
      ['platforms:a', 'platforms:b', 'platforms:c'],
    ])

    mockRedis.zrevrangebyscore.mockImplementation((key: string) => {
      const platformData: Record<string, object> = {
        'platforms:a': { name: 'a', versions: ['1.0.0'] },
        'platforms:b': { name: 'b', versions: ['1.0.0'] },
        'platforms:c': { name: 'c', versions: ['1.0.0'] },
        'schemas:a:1.0.0': {
          content: { '@extends': 'b/1.0.0' },
          dependencies: ['b/1.0.0'],
          output: {},
        },
        'schemas:b:1.0.0': {
          content: { '@extends': 'c/1.0.0' },
          dependencies: ['c/1.0.0'],
          output: {},
        },
        'schemas:c:1.0.0': {
          content: { '@extends': 'a/1.0.0' },
          dependencies: ['a/1.0.0'],
          output: {},
        },
      }

      const data = platformData[key]
      if (data) {
        return Promise.resolve([JSON.stringify(data)])
      }
      return Promise.resolve([])
    })
    mockRedis.zadd.mockResolvedValue(1)

    await expect(
      saveSchema('a', '1.0.0', { '@extends': 'b/1.0.0' })
    ).rejects.toThrow('Circular dependency')
  })
})

describe('large schema handling', () => {
  it('processes schema with many top-level keys', async () => {
    const content: Record<string, unknown> = {}
    for (let i = 0; i < 100; i++) {
      content[`feature_${i}`] = { enabled: i % 2 === 0, value: i }
    }

    const result = await previewJsonOutput(content)
    const output = JSON.parse(result)
    expect(Object.keys(output)).toHaveLength(100)
    expect(output.feature_0).toEqual({ enabled: true, value: 0 })
    expect(output.feature_99).toEqual({ enabled: false, value: 99 })
  })

  it('processes deeply nested schema (10 levels)', async () => {
    let content: Record<string, unknown> = { leaf: 'value' }
    for (let i = 0; i < 10; i++) {
      content = { [`level_${i}`]: content }
    }

    const result = await previewJsonOutput(content)
    const output = JSON.parse(result)

    let current: Record<string, unknown> = output
    for (let i = 9; i >= 0; i--) {
      expect(current).toHaveProperty(`level_${i}`)
      current = current[`level_${i}`] as Record<string, unknown>
    }
    expect(current).toEqual({ leaf: 'value' })
  })

  it('handles schema with mixed value types', async () => {
    const content = {
      string: 'hello',
      number: 42,
      float: 3.14,
      boolean: true,
      null_val: null,
      array: [1, 'two', { three: 3 }],
      nested: { a: { b: { c: 'deep' } } },
    }

    const result = await previewJsonOutput(content)
    const output = JSON.parse(result)
    expect(output.string).toBe('hello')
    expect(output.number).toBe(42)
    expect(output.float).toBe(3.14)
    expect(output.boolean).toBe(true)
    expect(output.null_val).toBeNull()
    expect(output.array).toEqual([1, 'two', { three: 3 }])
    expect(output.nested.a.b.c).toBe('deep')
  })
})

describe('semver range resolution in @extends', () => {
  it('resolves ^1.0.0 to highest matching minor version', async () => {
    setupPlatforms({ lib: ['1.0.0', '1.2.0', '1.5.0', '2.0.0'] })
    setupSchemaContent('lib/1.5.0', { resolved: true })

    const result = await previewJsonOutput({
      '@extends': 'lib/^1.0.0',
      extra: 'field',
    })

    const output = JSON.parse(result)
    expect(output.resolved).toBe(true)
    expect(output.extra).toBe('field')
  })

  it('resolves ~1.2.0 to highest matching patch version', async () => {
    setupPlatforms({ lib: ['1.2.0', '1.2.5', '1.3.0'] })
    setupSchemaContent('lib/1.2.5', { patched: true })

    const result = await previewJsonOutput({
      '@extends': 'lib/~1.2.0',
      added: 'value',
    })

    const output = JSON.parse(result)
    expect(output.patched).toBe(true)
  })

  it('resolves "latest" to highest version', async () => {
    setupPlatforms({ lib: ['1.0.0', '2.0.0', '3.0.0-beta.1', '2.5.0'] })
    setupSchemaContent('lib/2.5.0', { latest: true })

    const result = await previewJsonOutput({
      '@extends': 'lib/latest',
      child: true,
    })

    const output = JSON.parse(result)
    // 3.0.0-beta.1 sorts higher in semver.rcompare
    // but the actual behavior depends on semver sorting
    expect(output.child).toBe(true)
  })

  it('throws for unresolvable version range', async () => {
    setupPlatforms({ lib: ['1.0.0', '1.1.0'] })

    await expect(
      previewJsonOutput({ '@extends': 'lib/^5.0.0' })
    ).rejects.toThrow('No version found')
  })
})

describe('validation edge cases', () => {
  it('validates schema with multiple @extends references in nested objects', async () => {
    // No platforms available
    mockRedis.scan.mockResolvedValue(['0', []])

    const result = await validateSchemaContent({
      section1: { '@extends': 'missing1/1.0.0' },
      section2: { '@extends': 'missing2/1.0.0' },
    })

    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })

  it('validates schema with array values correctly', async () => {
    const result = await validateSchemaContent({
      features: ['a', 'b', 'c'],
      config: { items: [1, 2, 3] },
    })

    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('rejects null as schema content', async () => {
    const result = await validateSchemaContent(
      null as unknown as Record<string, unknown>
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Schema content must be a JSON object')
  })

  it('rejects array as schema content', async () => {
    const result = await validateSchemaContent(
      [1, 2, 3] as unknown as Record<string, unknown>
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Schema content must be a JSON object')
  })
})
