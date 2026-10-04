import { describe, expect, it, vi } from 'vitest'

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  })
)
vi.mock('next/navigation', () => ({ notFound }))

import { decodeRouteParam } from '@/lib/routeParams'

describe('decodeRouteParam', () => {
  it('decodes valid percent-encoding', () => {
    expect(decodeRouteParam('my%20platform')).toBe('my platform')
  })

  it('renders not-found for malformed percent-encoding', () => {
    expect(() => decodeRouteParam('%E0%A4%A')).toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalledTimes(1)
  })
})
