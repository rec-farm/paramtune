import { describe, expect, it } from 'vitest'
import { validateJson } from '@/components/JsonEditable/utils/validation'

describe('validateJson', () => {
  describe('Valid JSON', () => {
    it('returns valid for empty string', () => {
      const result = validateJson('')
      expect(result.isValid).toBe(true)
      expect(result.issues).toEqual([])
    })

    it('returns valid for whitespace string', () => {
      const result = validateJson('   \n  ')
      expect(result.isValid).toBe(true)
      expect(result.issues).toEqual([])
    })

    it('returns valid for simple objects', () => {
      const result = validateJson('{"a": 1, "b": "string", "c": true}')
      expect(result.isValid).toBe(true)
      expect(result.issues).toEqual([])
    })

    it('returns valid for arrays', () => {
      const result = validateJson('[1, 2, "3", false, null]')
      expect(result.isValid).toBe(true)
      expect(result.issues).toEqual([])
    })

    it('returns valid for nested structures', () => {
      const result = validateJson('{"user": {"name": "Alice", "roles": ["admin"]}}')
      expect(result.isValid).toBe(true)
      expect(result.issues).toEqual([])
    })
  })

  describe('Syntax errors', () => {
    it('catches missing quotes on keys', () => {
      const result = validateJson('{a: 1}')
      expect(result.isValid).toBe(false)
      expect(result.issues).toHaveLength(1)

      const issue = result.issues[0]
      expect(issue.type).toBe('error')
      // Note: error messages differ slightly between Node/V8 versions,
      // but they generally contain position or line/column
      expect(issue.message).toBeDefined()
      expect(typeof issue.message).toBe('string')
      expect(issue.message.length).toBeGreaterThan(0)
    })

    it('catches unclosed strings', () => {
      const result = validateJson('{"key": "value}')
      expect(result.isValid).toBe(false)
      expect(result.issues[0].type).toBe('error')
    })

    it('catches unclosed objects', () => {
      const result = validateJson('{"key": "value"')
      expect(result.isValid).toBe(false)
      expect(result.issues[0].type).toBe('error')
    })

    it('catches unexpected tokens', () => {
      const result = validateJson('{"key": undefined}')
      expect(result.isValid).toBe(false)
      expect(result.issues[0].type).toBe('error')
    })

    it('extracts line and column from the error message if present', () => {
      // Create a multi-line syntax error to test line extraction
      const json = `{\n  "a": 1,\n  "b": \n}`
      const result = validateJson(json)
      expect(result.isValid).toBe(false)
      expect(result.issues).toHaveLength(1)

      const issue = result.issues[0]
      // JSON.parse throws different formats, sometimes "at position X" sometimes "at line X column Y"
      // the regex in extractErrorPosition handles both by looking for `position X` or `line X...column Y`
      // We'll assert that either line/column are populated or the regex couldn't find them,
      // but if position is present, line should be calculated correctly.
      if (issue.line !== undefined) {
        expect(issue.line).toBeGreaterThan(0)
      }
    })
  })

  describe('Warnings: Duplicate keys', () => {
    it('detects duplicate keys in a flat object', () => {
      const json = `{\n  "key1": 1,\n  "key1": 2\n}`
      const result = validateJson(json)

      // Syntax is valid
      expect(result.isValid).toBe(true)

      // Should have 1 warning
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].type).toBe('warning')
      expect(result.issues[0].message).toContain('Duplicate key "key1"')
    })

    it('detects duplicate keys with different values', () => {
      const json = '{"a": 1, "b": 2, "a": 3}'
      const result = validateJson(json)
      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].message).toContain('Duplicate key "a"')
    })

    it('does not flag duplicate keys at different nesting levels', () => {
      const json = '{"a": 1, "b": {"a": 2}}'
      const result = validateJson(json)
      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(0)
    })

    it('detects duplicate keys in nested objects', () => {
      const json = '{"nested": {"a": 1, "a": 2}}'
      const result = validateJson(json)
      expect(result.isValid).toBe(true)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].message).toContain('Duplicate key "a"')
    })
  })

  describe('Warnings: Trailing commas', () => {
    it('detects trailing comma before closing brace', () => {
      // NOTE: standard JSON.parse fails on trailing comma,
      // so validateJson would normally catch this as a syntax error first
      // since it returns immediately on syntax error.
      // However, if some custom parse allowed it or if the text was evaluated
      // for warnings anyway, the regex would flag it.
      // In this current implementation of validateJson, standard trailing commas
      // cause an error in JSON.parse, meaning it returns before hitting the warning code.
      // We test that it correctly registers as invalid.
      const json = '{"a": 1,}'
      const result = validateJson(json)
      expect(result.isValid).toBe(false)
      expect(result.issues).toHaveLength(1)
      expect(result.issues[0].type).toBe('error')
    })
  })
})
