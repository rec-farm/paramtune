import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/server', () => {
  class MockNextResponse {
    _body: any
    _init: any

    constructor(body?: any, init?: any) {
      this._body = body
      this._init = init
    }

    static json(body: any, init?: any) {
      const response = new MockNextResponse(body, init)
      ;(response as any).json = async () => body
      return response
    }
  }
  return { NextResponse: MockNextResponse }
})

const mockAuth = vi.hoisted(() => ({
  api: { getSession: vi.fn() },
}))
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockGetPlatform = vi.hoisted(() => vi.fn())
vi.mock('@/models/Platform', () => ({
  getPlatform: mockGetPlatform,
  savePlatform: vi.fn(),
}))

import { GET } from '@/app/api/[platform]/versions/route'

function makeRequest() {
  return { headers: new Headers() } as unknown as Request
}

describe('GET /api/[platform]/versions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.api.getSession.mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } })
  })

  it('returns 404 when the platform does not exist', async () => {
    mockGetPlatform.mockResolvedValue(null)

    const response = (await GET(makeRequest(), {
      params: Promise.resolve({ platform: 'nonexistent' }),
    })) as any

    expect(response._init.status).toBe(404)
    expect(response._body).toEqual({ error: 'Platform not found' })
  })

  it('returns the versions list when the platform exists', async () => {
    mockGetPlatform.mockResolvedValue({
      name: 'ios',
      versions: ['1.0.0', '2.0.0'],
    })

    const response = (await GET(makeRequest(), {
      params: Promise.resolve({ platform: 'ios' }),
    })) as any

    expect(response._init.status).toBe(200)
    expect(response._body).toEqual(['1.0.0', '2.0.0'])
  })
})
