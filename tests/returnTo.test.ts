import { describe, expect, it } from 'vitest'
import { safeReturnTo } from '@/lib/returnTo'

const origin = 'https://paramtune.example'

describe('safeReturnTo', () => {
  it('keeps same-origin paths with their query and hash', () => {
    expect(safeReturnTo('/dashboard/ios/1.0.0?tab=history#x', origin)).toBe('/dashboard/ios/1.0.0?tab=history#x')
  })

  it.each([
    null, '', 'https://evil.example', '//evil.example', '/\\evil.example',
    '/\t/evil.example', '/\n/evil.example', '/\r/evil.example', '/\u007f/evil.example',
    '/api/auth/sign-out', 'javascript:alert(1)', '/.//evil.example', '/..//evil.example', '/a/..//evil.example', '/./api/x',
  ])('falls back to the dashboard for %j', (raw) => {
    expect(safeReturnTo(raw, origin)).toBe('/dashboard')
  })
})
