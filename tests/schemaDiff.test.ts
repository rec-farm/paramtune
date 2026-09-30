import { describe, expect, it } from 'vitest'

import {
  calculateDiff,
  diffSchemas,
  formatPath,
  getNestedKeys,
  getNestedValue,
  getValueDisplay,
} from '@/lib/schemaDiff'

describe('getNestedKeys', () => {
  it('returns top-level keys for a flat object', () => {
    const result = getNestedKeys({ a: 1, b: 2 })
    expect(result).toEqual(['a', 'b'])
  })

  it('returns dot-notation paths for nested objects', () => {
    const result = getNestedKeys({ a: { b: { c: 1 } } })
    expect(result).toEqual(['a', 'a.b', 'a.b.c'])
  })

  it('does not recurse into arrays', () => {
    const result = getNestedKeys({ items: [1, 2, 3] })
    expect(result).toEqual(['items'])
  })

  it('respects maxDepth', () => {
    // maxDepth=2 stops recursion at depth 2, so we get 'a' and 'a.b' but not 'a.b.c'
    const result = getNestedKeys({ a: { b: { c: 1 } } }, '', 2)
    expect(result).toContain('a')
    expect(result).toContain('a.b')
    expect(result).not.toContain('a.b.c')
  })

  it('returns empty array for empty object', () => {
    const result = getNestedKeys({})
    expect(result).toEqual([])
  })
})

describe('getNestedValue', () => {
  it('retrieves a top-level value', () => {
    expect(getNestedValue({ a: 42 }, 'a')).toBe(42)
  })

  it('retrieves a deeply nested value', () => {
    expect(getNestedValue({ a: { b: { c: 'deep' } } }, 'a.b.c')).toBe('deep')
  })

  it('returns undefined for missing paths', () => {
    expect(getNestedValue({ a: 1 }, 'b')).toBeUndefined()
  })
})

describe('formatPath', () => {
  it('converts numeric segments to bracket notation', () => {
    expect(formatPath('items.0.name')).toBe('items[0].name')
  })

  it('leaves non-numeric segments unchanged', () => {
    expect(formatPath('a.b.c')).toBe('a.b.c')
  })
})

describe('getValueDisplay', () => {
  it('wraps strings in quotes', () => {
    expect(getValueDisplay('hello')).toBe('"hello"')
  })

  it('displays null', () => {
    expect(getValueDisplay(null)).toBe('null')
  })

  it('displays undefined', () => {
    expect(getValueDisplay(undefined)).toBe('undefined')
  })

  it('displays numbers as strings', () => {
    expect(getValueDisplay(42)).toBe('42')
  })

  it('displays objects as JSON', () => {
    expect(getValueDisplay({ a: 1 })).toBe('{\n  "a": 1\n}')
  })
})

describe('calculateDiff', () => {
  it('detects added keys', () => {
    const result = calculateDiff({ a: 1, b: 2 }, { a: 1 })
    expect(result.summary.added).toBe(1)
    expect(result.byType.added[0].path).toBe('b')
    expect(result.byType.added[0].newValue).toBe(2)
  })

  it('detects removed keys', () => {
    const result = calculateDiff({ a: 1 }, { a: 1, b: 2 })
    expect(result.summary.removed).toBe(1)
    expect(result.byType.removed[0].path).toBe('b')
    expect(result.byType.removed[0].oldValue).toBe(2)
  })

  it('detects modified values', () => {
    const result = calculateDiff({ a: 2 }, { a: 1 })
    expect(result.summary.modified).toBe(1)
    expect(result.byType.modified[0].oldValue).toBe(1)
    expect(result.byType.modified[0].newValue).toBe(2)
  })

  it('detects type changes', () => {
    const result = calculateDiff({ a: 'string' }, { a: 42 })
    expect(result.byType.modified[0].typeChange).toEqual({
      from: 'number',
      to: 'string',
    })
  })

  it('includes unchanged when option is set', () => {
    const result = calculateDiff({ a: 1 }, { a: 1 }, { includeUnchanged: true })
    expect(result.summary.unchanged).toBe(1)
  })

  it('excludes unchanged by default', () => {
    const result = calculateDiff({ a: 1 }, { a: 1 })
    expect(result.summary.unchanged).toBe(0)
  })

  it('respects ignoreKeys', () => {
    const result = calculateDiff(
      { a: 1, secret: 'new' },
      { a: 1, secret: 'old' },
      { ignoreKeys: ['secret'] }
    )
    expect(result.summary.modified).toBe(0)
  })

  it('handles nested changes', () => {
    const result = calculateDiff(
      { config: { theme: 'dark' } },
      { config: { theme: 'light' } }
    )
    expect(result.byType.modified.some((c) => c.path === 'config.theme')).toBe(
      true
    )
  })

  it('returns empty diff for identical objects', () => {
    const obj = { a: 1, b: { c: 2 } }
    const result = calculateDiff(obj, obj)
    expect(result.summary.added).toBe(0)
    expect(result.summary.removed).toBe(0)
    expect(result.summary.modified).toBe(0)
  })

  it('does not flag a nested object as modified when only key order differs', () => {
    const result = calculateDiff(
      { config: { theme: 'dark', size: 'lg' } },
      { config: { size: 'lg', theme: 'dark' } }
    )
    expect(result.summary.modified).toBe(0)
    expect(result.summary.total).toBe(0)
  })

  it('still detects a real change inside a reordered nested object', () => {
    const result = calculateDiff(
      { config: { theme: 'light', size: 'lg' } },
      { config: { size: 'lg', theme: 'dark' } }
    )
    expect(result.byType.modified.some((c) => c.path === 'config.theme')).toBe(
      true
    )
  })

  it('does not flag an array as modified when only key order differs within its object elements', () => {
    const result = calculateDiff(
      { items: [{ id: 1, label: 'a' }, { id: 2, label: 'b' }] },
      { items: [{ label: 'a', id: 1 }, { label: 'b', id: 2 }] }
    )
    expect(result.summary.modified).toBe(0)
    expect(result.summary.total).toBe(0)
  })

  it('still detects a real change inside a reordered array element', () => {
    const result = calculateDiff(
      { items: [{ id: 1, label: 'a' }] },
      { items: [{ label: 'changed', id: 1 }] }
    )
    expect(result.byType.modified.some((c) => c.path === 'items')).toBe(true)
  })

  it('flags an array as modified when element order itself changes', () => {
    // Arrays are order-sensitive: unlike object keys, reordering the
    // elements themselves is a real change, not cosmetic.
    const result = calculateDiff(
      { items: [{ id: 1 }, { id: 2 }] },
      { items: [{ id: 2 }, { id: 1 }] }
    )
    expect(result.byType.modified.some((c) => c.path === 'items')).toBe(true)
  })
})

describe('diffSchemas', () => {
  it('compares two schemas by content', () => {
    const schemaA = { content: { key: 'a' } }
    const schemaB = { content: { key: 'b' } }
    const result = diffSchemas(schemaA, schemaB)
    expect(result.summary.modified).toBe(1)
  })

  it('treats A as the source and B as the target', () => {
    const result = diffSchemas(
      { content: { removedKey: 1, shared: 1 } },
      { content: { addedKey: 1, shared: 1 } }
    )
    expect(result.byType.added.map((c) => c.path)).toEqual(['addedKey'])
    expect(result.byType.removed.map((c) => c.path)).toEqual(['removedKey'])
  })

  it('returns no changes for identical schemas', () => {
    const schema = { content: { key: 'same' } }
    const result = diffSchemas(schema, schema)
    expect(result.summary.total).toBe(0)
  })
})
