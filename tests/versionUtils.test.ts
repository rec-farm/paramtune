import { describe, expect, it } from 'vitest'

import { sortVersionsDescending } from '@/lib/versionUtils'

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
})
