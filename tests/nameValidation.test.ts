import { describe, it, expect } from 'vitest'
import { isValidName } from '@/lib/nameValidation'

describe('isValidName', () => {
  it('accepts a simple alphanumeric name', () => {
    expect(isValidName('myplatform')).toBe(true)
  })

  it('accepts names with underscores, hyphens, and dots', () => {
    expect(isValidName('my_platform-1.0')).toBe(true)
  })

  it('accepts a name of exactly 128 characters', () => {
    expect(isValidName('a'.repeat(128))).toBe(true)
  })

  it('rejects an empty string', () => {
    expect(isValidName('')).toBe(false)
  })

  it('rejects a name of 129 characters', () => {
    expect(isValidName('a'.repeat(129))).toBe(false)
  })

  it('rejects names containing spaces', () => {
    expect(isValidName('my platform')).toBe(false)
  })

  it('rejects names containing slashes (path traversal)', () => {
    expect(isValidName('../secret')).toBe(false)
  })
})
