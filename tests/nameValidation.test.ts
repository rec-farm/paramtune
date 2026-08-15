import { describe, it, expect } from 'vitest'
import { isValidName, isValidVersionName } from '@/lib/nameValidation'

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

  it('rejects a plus sign, which is only meaningful for versions', () => {
    expect(isValidName('1.2.3+build.5')).toBe(false)
  })
})

describe('isValidVersionName', () => {
  it('accepts a plain semver version', () => {
    expect(isValidVersionName('1.2.3')).toBe(true)
  })

  it('accepts a version with build metadata', () => {
    // The reason this helper exists: `+` is legal semver but is rejected by
    // isValidName, so validating a version as a generic name made a version
    // the write paths accept impossible to read back.
    expect(isValidVersionName('1.2.3+build.5')).toBe(true)
  })

  it('accepts a version with both a pre-release and build metadata', () => {
    expect(isValidVersionName('1.0.0-beta.1+exp.sha.5114f85')).toBe(true)
  })

  it('accepts a non-semver version so previously stored versions stay readable', () => {
    expect(isValidVersionName('latest')).toBe(true)
  })

  it('rejects an empty string', () => {
    expect(isValidVersionName('')).toBe(false)
  })

  it('rejects a version longer than 128 characters', () => {
    expect(isValidVersionName(`1.2.3+${'a'.repeat(128)}`)).toBe(false)
  })

  it('rejects whitespace-padded versions', () => {
    expect(isValidVersionName(' 1.2.3 ')).toBe(false)
  })

  it('rejects versions containing slashes (path traversal)', () => {
    expect(isValidVersionName('../secret')).toBe(false)
  })
})
