import { describe, expect, it } from 'vitest'
import { extractExistingKeys } from '@/components/JsonEditable/utils/autocomplete'

describe('extractExistingKeys', () => {
  it('returns empty array for empty string', () => {
    expect(extractExistingKeys('')).toEqual([])
  })

  it('returns empty array for JSON with no keys', () => {
    expect(extractExistingKeys('{}')).toEqual([])
    expect(extractExistingKeys('[]')).toEqual([])
  })

  it('extracts unique keys from JSON string', () => {
    const json = `{
      "name": "test",
      "version": "1.0.0",
      "config": {
        "enabled": true
      }
    }`
    const result = extractExistingKeys(json)
    expect(result).toContain('name')
    expect(result).toContain('version')
    expect(result).toContain('config')
    expect(result).toContain('enabled')
    expect(result).toHaveLength(4)
  })

  it('handles duplicate keys and only returns unique ones', () => {
    const json = `{
      "key1": "val1",
      "key2": "val2",
      "key1": "val3"
    }`
    const result = extractExistingKeys(json)
    expect(result).toEqual(['key1', 'key2'])
  })

  it('ignores keys that are not quoted properly', () => {
    const text = 'key: value, "quoted": "value"'
    expect(extractExistingKeys(text)).toEqual(['quoted'])
  })

  it('handles nested structures', () => {
    const json = `{
      "a": {
        "b": {
          "c": 1
        }
      },
      "d": 2
    }`
    expect(extractExistingKeys(json)).toEqual(['a', 'b', 'c', 'd'])
  })
})
