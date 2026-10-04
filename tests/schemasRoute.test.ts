import { beforeEach, describe, expect, it, vi } from 'vitest'


const mockAuth = vi.hoisted(() => ({
  api: { getSession: vi.fn() },
}))
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockGetPlatforms = vi.hoisted(() => vi.fn())
vi.mock('@/models/Platform', () => ({
  getPlatforms: mockGetPlatforms,
}))

import { GET } from '@/server/routes/schemas'

function makeGetRequest() {
  return { headers: new Headers() } as unknown as Request
}

describe('GET /api/schemas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when there is no session', async () => {
    mockAuth.api.getSession.mockResolvedValue(null)

    const response = (await GET(makeGetRequest())) as any

    expect(response.status).toBe(401)
    expect((await response.json())).toEqual({ error: 'Unauthorized' })
    expect(mockGetPlatforms).not.toHaveBeenCalled()
  })

  it('returns the platform list when authenticated', async () => {
    mockAuth.api.getSession.mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } })
    mockGetPlatforms.mockResolvedValue([
      { name: 'ios', versions: ['1.0.0'] },
      { name: 'android', versions: ['2.0.0', '2.1.0'] },
    ])

    const response = (await GET(makeGetRequest())) as any

    expect(response.status).toBe(200)
    expect((await response.json())).toEqual([
      { name: 'ios', versions: ['1.0.0'] },
      { name: 'android', versions: ['2.0.0', '2.1.0'] },
    ])
  })

  it('returns an empty array when no platforms exist', async () => {
    mockAuth.api.getSession.mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } })
    mockGetPlatforms.mockResolvedValue([])

    const response = (await GET(makeGetRequest())) as any

    expect(response.status).toBe(200)
    expect((await response.json())).toEqual([])
  })
})
