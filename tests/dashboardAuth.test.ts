import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuth = vi.hoisted(() => ({
  api: { getSession: vi.fn() },
}))
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

import { requireDashboardSession } from '@/lib/dashboardAuth'

describe('requireDashboardSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('throws when there is no session', async () => {
    mockAuth.api.getSession.mockResolvedValue(null)

    await expect(requireDashboardSession(new Headers())).rejects.toThrow('Unauthorized')
  })

  it('returns the session when one exists', async () => {
    const session = { user: { id: 'u1', name: 'Ada', image: null } }
    mockAuth.api.getSession.mockResolvedValue(session)

    await expect(requireDashboardSession(new Headers())).resolves.toBe(session)
  })

  it('passes the given headers through to auth.api.getSession', async () => {
    mockAuth.api.getSession.mockResolvedValue({ user: { id: 'u1' } })
    const headers = new Headers({ cookie: 'better-auth.session_token=abc' })

    await requireDashboardSession(headers)

    expect(mockAuth.api.getSession).toHaveBeenCalledWith({ headers })
  })
})
