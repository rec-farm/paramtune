import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockRedis = vi.hoisted(() => ({
  zrevrangebyscore: vi.fn(),
  zadd: vi.fn(),
  scan: vi.fn(),
}))

vi.mock('@/connections/redis', () => ({
  default: mockRedis,
}))

import { getVersion, getVersions } from '@/models/Version'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getVersions', () => {
  it('returns versions array from platform data', async () => {
    const platform = { name: 'ios', versions: ['1.0.0', '2.0.0', '3.0.0'] }
    mockRedis.zrevrangebyscore.mockResolvedValue([JSON.stringify(platform)])

    const result = await getVersions('ios')
    expect(result).toEqual(['1.0.0', '2.0.0', '3.0.0'])
  })

  it('returns empty array when platform does not exist', async () => {
    mockRedis.zrevrangebyscore.mockResolvedValue([])

    const result = await getVersions('nonexistent')
    expect(result).toEqual([])
  })

  it('returns empty array when platform has no versions', async () => {
    const platform = { name: 'empty', versions: [] }
    mockRedis.zrevrangebyscore.mockResolvedValue([JSON.stringify(platform)])

    const result = await getVersions('empty')
    expect(result).toEqual([])
  })
})

describe('getVersion', () => {
  it('returns parsed version data when it exists', async () => {
    const schema = {
      content: { feature: true },
      dependencies: [],
      output: { feature: true },
    }
    mockRedis.zrevrangebyscore.mockResolvedValue([JSON.stringify(schema)])

    const result = await getVersion('ios', '1.0.0')
    expect(result).toEqual(schema)
    expect(mockRedis.zrevrangebyscore).toHaveBeenCalledWith(
      'schemas:ios:1.0.0',
      '+inf',
      '-inf',
      'LIMIT',
      0,
      1
    )
  })

  it('returns null when version does not exist', async () => {
    mockRedis.zrevrangebyscore.mockResolvedValue([])

    const result = await getVersion('ios', '99.0.0')
    expect(result).toBeNull()
  })
})
