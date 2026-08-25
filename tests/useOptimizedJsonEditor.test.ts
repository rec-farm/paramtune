import { describe, expect, it } from 'vitest'
import { formatJsonText } from '@/components/JsonEditable/hooks/useOptimizedJsonEditor'

describe('formatJsonText', () => {
  it('pretty-prints valid JSON and returns the parsed data', () => {
    const result = formatJsonText('{"b":2,"a":1}')
    expect(result).toEqual({
      formatted: JSON.stringify({ b: 2, a: 1 }, null, 2),
      data: { b: 2, a: 1 },
    })
  })

  it('returns null for text that is not valid JSON', () => {
    // The Format action must be a no-op on unparseable text rather than
    // falling back to some previously-parsed value — see formatJson in
    // useOptimizedJsonEditor.ts for why silently reverting is unsafe.
    expect(formatJsonText('{"a": 1,')).toBeNull()
    expect(formatJsonText('not json')).toBeNull()
    expect(formatJsonText('')).toBeNull()
  })

  it('returns null for valid JSON that is a primitive, matching safeParseJson', () => {
    expect(formatJsonText('"just a string"')).toBeNull()
    expect(formatJsonText('42')).toBeNull()
    expect(formatJsonText('null')).toBeNull()
  })

  it('formats exactly the text passed in, independent of any prior parse', () => {
    // Regression test: formatJson used to format the hook's cached
    // state.data instead of the current state.jsonText. Since validation is
    // debounced, clicking Format during that window silently reverted the
    // editor to the previous, stale value. formatJsonText must always
    // reflect whatever text it's given.
    const first = formatJsonText('{"count": 1}')
    const second = formatJsonText('{"count": 2}')
    expect(first?.data).toEqual({ count: 1 })
    expect(second?.data).toEqual({ count: 2 })
  })
})
