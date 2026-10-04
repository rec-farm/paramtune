import { describe, expect, it } from 'vitest'

import {
  getLatestVersion,
  isValidVersion,
  sortVersionsDescending,
} from '@/lib/versionUtils'

describe('sortVersionsDescending', () => {
  it('sorts semver versions in descending order', () => {
    const versions = ['1.0.0', '2.0.0', '1.5.0', '0.1.0']
    expect(sortVersionsDescending(versions)).toEqual([
      '2.0.0',
      '1.5.0',
      '1.0.0',
      '0.1.0',
    ])
  })

  it('handles pre-release versions', () => {
    const versions = ['1.0.0', '1.0.0-beta.1', '1.0.0-alpha.1']
    expect(sortVersionsDescending(versions)).toEqual([
      '1.0.0',
      '1.0.0-beta.1',
      '1.0.0-alpha.1',
    ])
  })

  it('returns empty array for empty input', () => {
    expect(sortVersionsDescending([])).toEqual([])
  })

  it('does not mutate the original array', () => {
    const versions = ['2.0.0', '1.0.0']
    sortVersionsDescending(versions)
    expect(versions).toEqual(['2.0.0', '1.0.0'])
  })

  it('handles single version', () => {
    expect(sortVersionsDescending(['1.0.0'])).toEqual(['1.0.0'])
  })

  it('throws when given a non-semver version, demonstrating why creation must validate', () => {
    // Regression guard for the bug isValidVersion prevents: a version name that
    // passes the generic validateName check (alphanumeric/dot/dash/underscore)
    // but isn't valid semver crashes every later sort, e.g. the platforms
    // sidebar nav and "latest" dependency resolution.
    expect(() => sortVersionsDescending(['1.0.0', 'latest'])).toThrow(
      /Invalid Version/
    )
  })
})

describe('getLatestVersion', () => {
  it('returns the highest semver version regardless of array order', () => {
    // Regression guard: the dashboard pages used to take the last array
    // entry (or reverse the array) instead of sorting by semver, so a
    // version list that isn't already in ascending semver order — e.g.
    // backfilling "0.9.0" after "2.0.0" already exists — reported the wrong
    // version as "latest".
    expect(getLatestVersion(['2.0.0', '0.9.0', '1.5.0'])).toBe('2.0.0')
  })

  it('returns the only version for a single-element list', () => {
    expect(getLatestVersion(['1.0.0'])).toBe('1.0.0')
  })

  it('returns undefined for an empty list', () => {
    expect(getLatestVersion([])).toBeUndefined()
  })

  it('returns undefined for an undefined list', () => {
    expect(getLatestVersion(undefined)).toBeUndefined()
  })
})

describe('isValidVersion', () => {
  it('rejects non-string values, including ones whose string form looks valid', () => {
    expect(isValidVersion(['1.2.3'])).toBe(false)
    expect(isValidVersion(123)).toBe(false)
    expect(isValidVersion(undefined)).toBe(false)
  })

  it('accepts a standard semver version', () => {
    expect(isValidVersion('1.2.3')).toBe(true)
  })

  it('accepts pre-release and build metadata versions', () => {
    expect(isValidVersion('1.2.3-beta.1')).toBe(true)
    expect(isValidVersion('1.2.3+build.5')).toBe(true)
  })

  it('rejects the reserved "latest" keyword', () => {
    expect(isValidVersion('latest')).toBe(false)
  })

  it('rejects partial versions', () => {
    expect(isValidVersion('1.2')).toBe(false)
    expect(isValidVersion('1')).toBe(false)
  })

  it('rejects a version with too many numeric segments', () => {
    expect(isValidVersion('1.2.3.4')).toBe(false)
  })

  it('rejects non-numeric or empty strings', () => {
    expect(isValidVersion('abc')).toBe(false)
    expect(isValidVersion('')).toBe(false)
  })

  it('rejects whitespace-padded versions that semver would silently trim', () => {
    // semver.valid(' 1.2.3 ') returns '1.2.3', but callers persist the string
    // they were handed rather than semver's normalised form — so accepting
    // this would write a Redis key and URL segment containing spaces.
    expect(isValidVersion(' 1.2.3 ')).toBe(false)
    expect(isValidVersion('1.2.3 ')).toBe(false)
  })

  it('rejects a version longer than the maximum key length', () => {
    expect(isValidVersion(`1.2.3+${'a'.repeat(128)}`)).toBe(false)
  })
})
