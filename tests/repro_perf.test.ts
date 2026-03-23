import { vi, describe, it, expect, beforeEach } from 'vitest'

const mockRedis = vi.hoisted(() => ({
  zrevrangebyscore: vi.fn(),
  zadd: vi.fn(),
  sadd: vi.fn(),
  smembers: vi.fn(),
  scan: vi.fn(),
}))

vi.mock('@/connections/redis', () => ({
  default: {
    zrevrangebyscore: vi.fn(),
    zadd: vi.fn(),
    sadd: vi.fn(),
    smembers: vi.fn(),
    scan: vi.fn(),
  },
}))

import { clearPlatformsCache,  validateSchemaContent, previewJsonOutput } from '@/models/Schema'
import * as PlatformModels from '@/models/Platform'

import redis from '@/connections/redis'

describe('Performance Baseline', () => {
  beforeEach(() => {
  clearPlatformsCache();
    vi.clearAllMocks()
    vi.mocked(redis.scan).mockResolvedValue(['0', ['platforms:p1']])
    vi.mocked(redis.zrevrangebyscore).mockResolvedValue([JSON.stringify({ name: 'p1', versions: ['1.0.0'] })])
  })

  it('measures getPlatforms calls in validateSchemaContent', async () => {
    const getPlatformsSpy = vi.spyOn(PlatformModels, 'getPlatforms')

    const content = {
      p1: 'v1',
      p2: 'v2',
      p3: 'v3',
    }
    // We want to trigger many resolveDependenciesEffect calls.
    // validateSchemaContent calls it for each dependency.
    // In this case, dependencies are found by findDependenciesInContent.
    // findDependenciesInContent looks for '@extends'.

    const complexContent = {
      '@extends': 'p1/1.0.0',
      nested: {
        '@extends': 'p1/1.0.0',
        more: {
          '@extends': 'p1/1.0.0',
        }
      }
    }

    await validateSchemaContent(complexContent)

    console.log(`getPlatforms called ${getPlatformsSpy.mock.calls.length} times for validateSchemaContent`)
  })

  it('measures getPlatforms calls in previewJsonOutput (recursive)', async () => {
    const getPlatformsSpy = vi.spyOn(PlatformModels, 'getPlatforms')

    // Mock getSchemaEffect for p1/1.0.0 to return something that also has @extends
    // Actually previewJsonOutput calls processNodeWithExtendsEffect

    vi.mocked(redis.zrevrangebyscore).mockImplementation((key) => {
        if (key === 'platforms:p1') {
            return Promise.resolve([JSON.stringify({ name: 'p1', versions: ['1.0.0'] })])
        }
        if (key === 'schemas:p1:1.0.0') {
            return Promise.resolve([JSON.stringify({
                content: { '@extends': 'p1/1.0.0', a: 1 }, // This might cause infinite loop if not careful, but processNodeWithExtendsEffect has visited set
                dependencies: ['p1/1.0.0'],
                output: { a: 1 }
            })])
        }
        return Promise.resolve([])
    })

    const content = {
      '@extends': 'p1/1.0.0',
    }

    try {
        await previewJsonOutput(content)
    } catch (e) {
        // likely circular dependency if I'm not careful, but that's fine for counting calls
    }

    console.log(`getPlatforms called ${getPlatformsSpy.mock.calls.length} times for previewJsonOutput`)
  })
})
