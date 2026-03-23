import { describe, expect, it } from 'vitest'
import { extractExistingKeys, getAutocompleteContext } from '@/components/JsonEditable/utils/autocomplete'

describe('extractExistingKeys', () => {
  it('returns empty array for empty string', () => {
    expect(extractExistingKeys('')).toEqual([])
  })

  it('returns empty array for JSON with no keys', () => {
    expect(extractExistingKeys('{}')).toEqual([])
    expect(extractExistingKeys('[]')).toEqual([])
  })

  it('returns empty array for plain text with no keys', () => {
    expect(extractExistingKeys('just some plain text without any keys')).toEqual([])
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

describe('getAutocompleteContext', () => {
  it('detects empty object / root level contexts', () => {
    const text = ''
    const result = getAutocompleteContext(text, 0)
    expect(result).toEqual({
      line: '',
      column: 0,
      prefix: '',
      inString: false,
      afterColon: false,
    })
  })

  it('detects when the cursor is inside a string key', () => {
    const text = '{\n  "k'
    const result = getAutocompleteContext(text, 6)
    expect(result).toEqual({
      line: '  "k',
      column: 4,
      prefix: 'k',
      inString: true,
      afterColon: false,
    })
  })

  it('detects when the cursor is after a colon, expecting a value', () => {
    const text = '{\n  "key": '
    const result = getAutocompleteContext(text, 11)
    expect(result).toEqual({
      line: '  "key": ',
      column: 9,
      prefix: '',
      inString: false,
      afterColon: true,
    })
  })

  it('extracts prefix correctly inside quotes', () => {
    const text = '{\n  "key": "val'
    const result = getAutocompleteContext(text, 15)
    expect(result).toEqual({
      line: '  "key": "val',
      column: 13,
      prefix: 'val',
      inString: true,
      afterColon: true,
    })
  })

  it('extracts prefix correctly outside quotes', () => {
    const text = '{\n  "key": tr'
    const result = getAutocompleteContext(text, 13)
    expect(result).toEqual({
      line: '  "key": tr',
      column: 11,
      prefix: 'tr',
      inString: false,
      afterColon: true,
    })
  })

  it('handles escaped quotes correctly for inString flag calculation', () => {
    const text = '{\n  "key": "val\\"ue'
    const result = getAutocompleteContext(text, 19)
    expect(result).toEqual({
      line: '  "key": "val\\"ue',
      column: 17,
      prefix: 'ue',
      inString: true,
      // TODO: `isAfterColon` does not correctly handle escaped quotes inside string values
      afterColon: false,
    })
  })
})
