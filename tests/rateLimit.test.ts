import { afterEach, describe, expect, it, vi } from 'vitest'

import { checkRateLimit } from '@/lib/rateLimit'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('checkRateLimit', () => {
  it('allows requests under the limit', () => {
    const result = checkRateLimit('1.1.1.1', 'api')
    expect(result).toEqual({ allowed: true })
  })

  it('blocks requests once the limit is exceeded, with a retryAfter', () => {
    const ip = '1.1.1.2'
    for (let i = 0; i < 100; i++) {
      expect(checkRateLimit(ip, 'api').allowed).toBe(true)
    }

    const blocked = checkRateLimit(ip, 'api')
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfter).toBeGreaterThan(0)
  })

  it('applies the stricter auth limit (10/15min) separately from the api limit (100/min)', () => {
    const ip = '1.1.1.3'
    for (let i = 0; i < 10; i++) {
      expect(checkRateLimit(ip, 'auth').allowed).toBe(true)
    }
    expect(checkRateLimit(ip, 'auth').allowed).toBe(false)

    // Same IP, different bucket — the auth limit doesn't bleed into api.
    expect(checkRateLimit(ip, 'api').allowed).toBe(true)
  })

  it('tracks separate buckets per IP', () => {
    const ipA = '1.1.1.4'
    const ipB = '1.1.1.5'
    for (let i = 0; i < 100; i++) {
      checkRateLimit(ipA, 'api')
    }

    expect(checkRateLimit(ipA, 'api').allowed).toBe(false)
    expect(checkRateLimit(ipB, 'api').allowed).toBe(true)
  })

  it('resets the count once the window has elapsed', () => {
    const ip = '1.1.1.6'
    const now = Date.now()
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(now)

    for (let i = 0; i < 100; i++) {
      checkRateLimit(ip, 'api')
    }
    expect(checkRateLimit(ip, 'api').allowed).toBe(false)

    nowSpy.mockReturnValue(now + 60_000 + 1)
    expect(checkRateLimit(ip, 'api').allowed).toBe(true)
  })
})
