import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  findAccountByKey: vi.fn(),
  deleteUserSessions: vi.fn(),
  verify: vi.fn(),
  settings: { clientId: 'paramtune' } as Record<string, unknown> | null,
}))

vi.mock('@/lib/auth', () => ({
  auth: {
    $context: Promise.resolve({
      internalAdapter: {
        findAccountByKey: mocks.findAccountByKey,
        deleteUserSessions: mocks.deleteUserSessions,
      },
    }),
  },
  get oidcSettings() {
    return mocks.settings
  },
}))
vi.mock('@/lib/oidcLogoutToken', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/oidcLogoutToken')>()),
  verifyLogoutTokenWithDiscovery: mocks.verify,
}))

import { POST } from '@/app/api/auth/backchannel-logout/route'
import { LogoutTokenError } from '@/lib/oidcLogoutToken'

function logoutRequest(body: string, contentType = 'application/x-www-form-urlencoded') {
  return new Request('http://localhost/api/auth/backchannel-logout', {
    method: 'POST',
    headers: { 'content-type': contentType },
    body,
  })
}

describe('POST /api/auth/backchannel-logout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.settings = { clientId: 'paramtune' }
  })

  it('ends every session of the account behind sub', async () => {
    mocks.verify.mockResolvedValue({ sub: 'user-sub', sid: 's1' })
    mocks.findAccountByKey.mockResolvedValue({ userId: 'u1' })

    const response = await POST(logoutRequest('logout_token=abc'))

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(mocks.verify).toHaveBeenCalledWith('abc', mocks.settings)
    expect(mocks.findAccountByKey).toHaveBeenCalledWith({ providerId: 'oidc', accountId: 'user-sub' })
    expect(mocks.deleteUserSessions).toHaveBeenCalledWith('u1')
  })

  it('answers 200 for an unknown subject', async () => {
    mocks.verify.mockResolvedValue({ sub: 'nobody' })
    mocks.findAccountByKey.mockResolvedValue(null)

    const response = await POST(logoutRequest('logout_token=abc'))

    expect(response.status).toBe(200)
    expect(mocks.deleteUserSessions).not.toHaveBeenCalled()
  })

  it('answers 400 for an invalid token', async () => {
    mocks.verify.mockRejectedValue(new LogoutTokenError('bad'))

    const response = await POST(logoutRequest('logout_token=abc'))

    expect(response.status).toBe(400)
    expect(mocks.deleteUserSessions).not.toHaveBeenCalled()
  })

  it('answers 400 without a logout_token', async () => {
    expect((await POST(logoutRequest('other=1'))).status).toBe(400)
    expect((await POST(logoutRequest('{"logout_token":"abc"}', 'application/json'))).status).toBe(400)
    expect(mocks.verify).not.toHaveBeenCalled()
  })

  it('is not found when OIDC is off', async () => {
    mocks.settings = null
    expect((await POST(logoutRequest('logout_token=abc'))).status).toBe(404)
  })
})
