import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/connections/redis')
import mockRedis from '@/connections/__mocks__/redis'

import { clearPlatformsCache,
  compareSchemasWithContent,
  getSchema,
  getSchemaHistoryWithTimestamps,
  previewJsonOutput,
  saveSchema,
  validateSchemaContent,
} from '@/models/Schema'

beforeEach(() => {
  clearPlatformsCache();
  vi.clearAllMocks()
  // Default: no platforms found by scan
  mockRedis.scan.mockResolvedValue(['0', []])
  mockRedis.smembers.mockResolvedValue([])
})

describe('getSchema', () => {
  it('returns parsed schema when data exists in Redis', async () => {
    const stored = {
      content: { key: 'value' },
      dependencies: [],
      output: { key: 'value' },
    }
    mockRedis.zrevrangebyscore.mockResolvedValue([JSON.stringify(stored)])

    const result = await getSchema('my-platform', '1.0.0')
    expect(result).toEqual(stored)
    expect(mockRedis.zrevrangebyscore).toHaveBeenCalledWith(
      'schemas:my-platform:1.0.0',
      '+inf',
      '-inf',
      'LIMIT',
      0,
      1
    )
  })

  it('returns empty object when no data exists', async () => {
    mockRedis.zrevrangebyscore.mockResolvedValue([])

    const result = await getSchema('missing', '1.0.0')
    expect(result).toEqual({})
  })
})

describe('saveSchema', () => {
  it('saves schema content with dependencies to Redis', async () => {
    // No @extends references, so no dependency resolution needed
    mockRedis.zadd.mockResolvedValue(1)
    mockRedis.smembers.mockResolvedValue([])

    await saveSchema('test-platform', '1.0.0', { setting: true })

    expect(mockRedis.zadd).toHaveBeenCalledWith(
      'schemas:test-platform:1.0.0',
      expect.any(Number),
      expect.stringContaining('"setting":true')
    )
  })

  it('throws when content is not a plain object', async () => {
    await expect(
      saveSchema('test', '1.0.0', 'not-an-object' as unknown as Record<string, unknown>)
    ).rejects.toThrow('Schema content must be a JSON object')
  })

  it('saves author information when provided', async () => {
    mockRedis.zadd.mockResolvedValue(1)
    mockRedis.smembers.mockResolvedValue([])

    const author = { id: 'user-1', name: 'Test User' }
    await saveSchema('test', '1.0.0', { key: 'val' }, author)

    const savedJson = mockRedis.zadd.mock.calls[0][2] as string
    const savedData = JSON.parse(savedJson)
    expect(savedData.author).toEqual(author)
  })

  it('detects @extends dependencies in content', async () => {
    // Set up platform resolution for the dependency
    mockRedis.scan.mockResolvedValue([
      '0',
      ['platforms:base-platform'],
    ])
    mockRedis.zrevrangebyscore.mockImplementation(
      (key: string) => {
        if (key === 'platforms:base-platform') {
          return Promise.resolve([
            JSON.stringify({
              name: 'base-platform',
              versions: ['1.0.0'],
            }),
          ])
        }
        if (key === 'schemas:base-platform:1.0.0') {
          return Promise.resolve([
            JSON.stringify({
              content: { baseKey: 'baseValue' },
              dependencies: [],
              output: { baseKey: 'baseValue' },
            }),
          ])
        }
        return Promise.resolve([])
      }
    )
    mockRedis.zadd.mockResolvedValue(1)
    mockRedis.smembers.mockResolvedValue([])

    await saveSchema('child', '1.0.0', {
      '@extends': 'base-platform/1.0.0',
      childKey: 'childValue',
    })

    // Should register dependency
    expect(mockRedis.sadd).toHaveBeenCalledWith(
      'schemas:dependents:base-platform:1.0.0',
      'child/1.0.0'
    )
  })
})

describe('validateSchemaContent', () => {
  it('returns valid for schema without @extends', async () => {
    const result = await validateSchemaContent({ simple: 'value' })
    expect(result).toEqual({ valid: true, errors: [] })
  })

  it('returns invalid for non-object content', async () => {
    const result = await validateSchemaContent(
      'string' as unknown as Record<string, unknown>
    )
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('Schema content must be a JSON object')
  })

  it('returns error for unresolvable @extends reference', async () => {
    // No platforms available
    mockRedis.scan.mockResolvedValue(['0', []])

    const result = await validateSchemaContent({
      '@extends': 'nonexistent/1.0.0',
    })
    expect(result.valid).toBe(false)
    expect(result.errors[0]).toContain('Platform "nonexistent" not found')
  })
})

describe('previewJsonOutput', () => {
  it('returns JSON string for simple content', async () => {
    const result = await previewJsonOutput({ key: 'value' })
    expect(JSON.parse(result)).toEqual({ key: 'value' })
  })

  it('processes nested objects', async () => {
    const result = await previewJsonOutput({
      nested: { deep: { value: 42 } },
    })
    expect(JSON.parse(result)).toEqual({ nested: { deep: { value: 42 } } })
  })
})

describe('getSchemaHistoryWithTimestamps', () => {
  it('returns history entries with timestamps', async () => {
    const entry1 = {
      content: { v: 1 },
      dependencies: [],
      output: { v: 1 },
    }
    const entry2 = {
      content: { v: 2 },
      dependencies: [],
      output: { v: 2 },
    }

    mockRedis.zrevrangebyscore.mockResolvedValue([
      JSON.stringify(entry2),
      '2000',
      JSON.stringify(entry1),
      '1000',
    ])

    const result = await getSchemaHistoryWithTimestamps('plat', '1.0.0')
    expect(result).toHaveLength(2)
    expect(result[0].timestamp).toBe(2000)
    expect(result[0].content).toEqual({ v: 2 })
    expect(result[1].timestamp).toBe(1000)
  })

  it('returns empty array when no history', async () => {
    mockRedis.zrevrangebyscore.mockResolvedValue([])
    const result = await getSchemaHistoryWithTimestamps('plat', '1.0.0')
    expect(result).toEqual([])
  })

  it('logs and skips malformed entries, keeping the rest', async () => {
    const entry = {
      content: { v: 1 },
      dependencies: [],
      output: { v: 1 },
    }
    mockRedis.zrevrangebyscore.mockResolvedValue([
      'not valid json',
      '2000',
      JSON.stringify(entry),
      '1000',
    ])
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const result = await getSchemaHistoryWithTimestamps('plat', '1.0.0')

    expect(result).toHaveLength(1)
    expect(result[0].timestamp).toBe(1000)
    expect(result[0].content).toEqual({ v: 1 })
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to parse schema history entry for "schemas:plat:1.0.0":',
      expect.any(Error)
    )

    consoleErrorSpy.mockRestore()
  })
})

describe('circular dependency detection', () => {
  it('throws on circular @extends reference', async () => {
    // Platform A extends Platform B, Platform B extends Platform A
    mockRedis.scan.mockResolvedValue([
      '0',
      ['platforms:platformA', 'platforms:platformB'],
    ])
    mockRedis.zrevrangebyscore.mockImplementation(
      (key: string) => {
        if (key === 'platforms:platformA') {
          return Promise.resolve([
            JSON.stringify({
              name: 'platformA',
              versions: ['1.0.0'],
            }),
          ])
        }
        if (key === 'platforms:platformB') {
          return Promise.resolve([
            JSON.stringify({
              name: 'platformB',
              versions: ['1.0.0'],
            }),
          ])
        }
        if (key === 'schemas:platformA:1.0.0') {
          return Promise.resolve([
            JSON.stringify({
              content: { '@extends': 'platformB/1.0.0' },
              dependencies: ['platformB/1.0.0'],
              output: {},
            }),
          ])
        }
        if (key === 'schemas:platformB:1.0.0') {
          return Promise.resolve([
            JSON.stringify({
              content: { '@extends': 'platformA/1.0.0' },
              dependencies: ['platformA/1.0.0'],
              output: {},
            }),
          ])
        }
        return Promise.resolve([])
      }
    )
    mockRedis.zadd.mockResolvedValue(1)
    mockRedis.smembers.mockResolvedValue([])

    await expect(
      saveSchema('platformA', '1.0.0', {
        '@extends': 'platformB/1.0.0',
      })
    ).rejects.toThrow('Circular dependency')
  })
})

describe('compareSchemasWithContent', () => {
  it('returns the diff and both schemas\' content from a single fetch per schema', async () => {
    const schemaA = {
      content: { key: 'old', removed: true },
      dependencies: [],
      output: {},
    }
    const schemaB = {
      content: { key: 'new', added: true },
      dependencies: [],
      output: {},
    }

    mockRedis.zrevrangebyscore.mockImplementation(
      (key: string) => {
        if (key === 'schemas:platA:1.0.0') {
          return Promise.resolve([JSON.stringify(schemaA)])
        }
        if (key === 'schemas:platB:1.0.0') {
          return Promise.resolve([JSON.stringify(schemaB)])
        }
        return Promise.resolve([])
      }
    )

    const result = await compareSchemasWithContent('platA', '1.0.0', 'platB', '1.0.0')

    expect(result.schemaAContent).toEqual(schemaA.content)
    expect(result.schemaBContent).toEqual(schemaB.content)
    expect(result.diffResult.summary.modified).toBe(1)
    expect(result.diffResult.summary.added).toBe(1)
    expect(result.diffResult.summary.removed).toBe(1)

    // Regression guard: the dashboard compare page used to call compareSchemas
    // (2 reads) and then getSchema for each side again (2 more reads) to
    // recover content compareSchemas had already fetched internally.
    expect(mockRedis.zrevrangebyscore).toHaveBeenCalledTimes(2)
  })

  it('defaults to empty content when a schema does not exist', async () => {
    mockRedis.zrevrangebyscore.mockResolvedValue([])

    const result = await compareSchemasWithContent('missingA', '1.0.0', 'missingB', '1.0.0')

    expect(result.schemaAContent).toEqual({})
    expect(result.schemaBContent).toEqual({})
  })
})

describe('schema composition (@extends deep merge)', () => {
  it('merges base schema content with child overrides', async () => {
    // Setup: child extends base, base has {a: 1, b: 2}, child overrides {b: 3, c: 4}
    mockRedis.scan.mockResolvedValue([
      '0',
      ['platforms:base'],
    ])
    mockRedis.zrevrangebyscore.mockImplementation(
      (key: string) => {
        if (key === 'platforms:base') {
          return Promise.resolve([
            JSON.stringify({ name: 'base', versions: ['1.0.0'] }),
          ])
        }
        if (key === 'schemas:base:1.0.0') {
          return Promise.resolve([
            JSON.stringify({
              content: { a: 1, b: 2 },
              dependencies: [],
              output: { a: 1, b: 2 },
            }),
          ])
        }
        return Promise.resolve([])
      }
    )

    const result = await previewJsonOutput({
      '@extends': 'base/1.0.0',
      b: 3,
      c: 4,
    })

    const output = JSON.parse(result)
    expect(output).toEqual({ a: 1, b: 3, c: 4 })
  })

  it('deep merges nested objects from base schema', async () => {
    mockRedis.scan.mockResolvedValue([
      '0',
      ['platforms:base'],
    ])
    mockRedis.zrevrangebyscore.mockImplementation(
      (key: string) => {
        if (key === 'platforms:base') {
          return Promise.resolve([
            JSON.stringify({ name: 'base', versions: ['1.0.0'] }),
          ])
        }
        if (key === 'schemas:base:1.0.0') {
          return Promise.resolve([
            JSON.stringify({
              content: {
                settings: { theme: 'light', fontSize: 14 },
              },
              dependencies: [],
              output: { settings: { theme: 'light', fontSize: 14 } },
            }),
          ])
        }
        return Promise.resolve([])
      }
    )

    const result = await previewJsonOutput({
      '@extends': 'base/1.0.0',
      settings: { theme: 'dark' },
    })

    const output = JSON.parse(result)
    expect(output.settings).toEqual({ theme: 'dark', fontSize: 14 })
  })
})
