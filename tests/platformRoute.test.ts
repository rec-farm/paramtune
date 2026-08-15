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
const mockSavePlatform = vi.hoisted(() => vi.fn())
vi.mock('@/models/Platform', () => ({
  getPlatform: mockGetPlatform,
  savePlatform: mockSavePlatform,
}))

const mockLogAudit = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auditLog', () => ({ logAudit: mockLogAudit }))

import { GET, POST } from '@/app/api/[platform]/route'

function makeGetRequest() {
  return { headers: new Headers() } as unknown as Request
}

function makePostRequest(body: unknown) {
  return {
    headers: new Headers(),
    json: async () => body,
  } as unknown as Request
}

describe('GET /api/[platform]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.api.getSession.mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } })
  })

  it('returns 404 when the platform does not exist', async () => {
    mockGetPlatform.mockResolvedValue(null)

    const response = (await GET(makeGetRequest(), {
      params: Promise.resolve({ platform: 'nonexistent' }),
    })) as any

    expect(response._init.status).toBe(404)
    expect(response._body).toEqual({ error: 'Platform not found' })
  })

  it('returns the platform when it exists', async () => {
    mockGetPlatform.mockResolvedValue({ name: 'ios', versions: ['1.0.0'] })

    const response = (await GET(makeGetRequest(), {
      params: Promise.resolve({ platform: 'ios' }),
    })) as any

    expect(response._init.status).toBe(200)
    expect(response._body).toEqual({ name: 'ios', versions: ['1.0.0'] })
  })
})

describe('POST /api/[platform]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.api.getSession.mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } })
    mockSavePlatform.mockResolvedValue(undefined)
    mockLogAudit.mockResolvedValue(undefined)
  })

  it('rejects a body with no "versions" key instead of silently wiping the version list', async () => {
    const response = (await POST(makePostRequest({}), {
      params: Promise.resolve({ platform: 'ios' }),
    })) as any

    expect(response._init.status).toBe(400)
    expect(response._body).toEqual({ error: 'Missing "versions" in body' })
    expect(mockSavePlatform).not.toHaveBeenCalled()
  })

  it('rejects when "versions" is not an array of valid semver strings', async () => {
    const response = (await POST(makePostRequest({ versions: ['not-semver'] }), {
      params: Promise.resolve({ platform: 'ios' }),
    })) as any

    expect(response._init.status).toBe(400)
    expect(mockSavePlatform).not.toHaveBeenCalled()
  })

  it('saves a deduplicated version list when "versions" is valid', async () => {
    const response = (await POST(
      makePostRequest({ versions: ['1.0.0', '1.0.0', '2.0.0'] }),
      { params: Promise.resolve({ platform: 'ios' }) }
    )) as any

    expect(response._init.status).toBe(201)
    expect(response._body).toEqual({ ok: true })
    expect(mockSavePlatform).toHaveBeenCalledWith('ios', {
      name: 'ios',
      versions: ['1.0.0', '2.0.0'],
    })
  })

  it('allows an explicit empty "versions" array (caller intentionally clearing versions)', async () => {
    const response = (await POST(makePostRequest({ versions: [] }), {
      params: Promise.resolve({ platform: 'ios' }),
    })) as any

    expect(response._init.status).toBe(201)
    expect(mockSavePlatform).toHaveBeenCalledWith('ios', { name: 'ios', versions: [] })
  })
})
