import { describe, expect, it } from 'vitest'

import {
  isValidVersion,
  isValidVersionsList,
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

describe('isValidVersion', () => {
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
})

describe('isValidVersionsList', () => {
  it('accepts an array of valid semver strings', () => {
    expect(isValidVersionsList(['1.0.0', '2.1.3-beta.1'])).toBe(true)
  })

  it('accepts an empty array', () => {
    expect(isValidVersionsList([])).toBe(true)
  })

  it('rejects a non-array value', () => {
    expect(isValidVersionsList('1.0.0')).toBe(false)
    expect(isValidVersionsList(null)).toBe(false)
    expect(isValidVersionsList(undefined)).toBe(false)
    expect(isValidVersionsList({ length: 0 })).toBe(false)
  })

  it('rejects an array containing a non-semver entry', () => {
    expect(isValidVersionsList(['1.0.0', 'latest'])).toBe(false)
  })

  it('rejects an array containing a non-string entry', () => {
    expect(isValidVersionsList(['1.0.0', 42])).toBe(false)
  })
})
