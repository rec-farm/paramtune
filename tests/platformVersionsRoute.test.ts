import { beforeEach, describe, expect, it, vi } from 'vitest'


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

import { GET, POST } from '@/server/routes/versions'

function makeRequest() {
  return { headers: new Headers() } as unknown as Request
}

function makePostRequest(body: unknown) {
  return {
    headers: new Headers(),
    json: async () => body,
  } as unknown as Request
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

    expect(response.status).toBe(404)
    expect((await response.json())).toEqual({ error: 'Platform not found' })
  })

  it('returns the versions list when the platform exists', async () => {
    mockGetPlatform.mockResolvedValue({
      name: 'ios',
      versions: ['1.0.0', '2.0.0'],
    })

    const response = (await GET(makeRequest(), {
      params: Promise.resolve({ platform: 'ios' }),
    })) as any

    expect(response.status).toBe(200)
    expect((await response.json())).toEqual(['1.0.0', '2.0.0'])
  })
})

describe('POST /api/[platform]/versions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.api.getSession.mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } })
  })

  it('returns 404 when the platform does not exist', async () => {
    mockGetPlatform.mockResolvedValue(null)

    const response = (await POST(makePostRequest({ version: '1.0.0' }), {
      params: Promise.resolve({ platform: 'nonexistent' }),
    })) as any

    expect(response.status).toBe(404)
    expect((await response.json())).toEqual({ error: 'Platform not found' })
    expect(mockSavePlatform).not.toHaveBeenCalled()
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  it('adds the version and returns 201 when the platform exists', async () => {
    mockGetPlatform.mockResolvedValue({ name: 'ios', versions: ['1.0.0'] })
    mockSavePlatform.mockResolvedValue(undefined)
    mockLogAudit.mockResolvedValue(undefined)

    const response = (await POST(makePostRequest({ version: '2.0.0' }), {
      params: Promise.resolve({ platform: 'ios' }),
    })) as any

    expect(response.status).toBe(201)
    expect((await response.json())).toEqual({ ok: true })
    expect(mockSavePlatform).toHaveBeenCalledWith('ios', {
      name: 'ios',
      versions: ['1.0.0', '2.0.0'],
    })
  })

  it('accepts a version with build metadata, which is valid semver', async () => {
    mockGetPlatform.mockResolvedValue({ name: 'ios', versions: ['1.0.0'] })
    mockSavePlatform.mockResolvedValue(undefined)
    mockLogAudit.mockResolvedValue(undefined)

    const response = (await POST(makePostRequest({ version: '1.2.3+build.5' }), {
      params: Promise.resolve({ platform: 'ios' }),
    })) as any

    expect(response.status).toBe(201)
    expect((await response.json())).toEqual({ ok: true })
    expect(mockSavePlatform).toHaveBeenCalledWith('ios', {
      name: 'ios',
      versions: ['1.0.0', '1.2.3+build.5'],
    })
  })

  it('rejects a version that is not valid semver', async () => {
    mockGetPlatform.mockResolvedValue({ name: 'ios', versions: ['1.0.0'] })

    const response = (await POST(makePostRequest({ version: 'not-a-version' }), {
      params: Promise.resolve({ platform: 'ios' }),
    })) as any

    expect(response.status).toBe(400)
    expect(mockSavePlatform).not.toHaveBeenCalled()
  })

  it('rejects a whitespace-padded version instead of storing it verbatim', async () => {
    // semver.valid(' 1.2.3 ') trims and returns '1.2.3', but the route stores
    // the raw string — so without a charset guard this would persist a version
    // whose Redis key and URL contain spaces, which no read path can look up.
    mockGetPlatform.mockResolvedValue({ name: 'ios', versions: ['1.0.0'] })

    const response = (await POST(makePostRequest({ version: ' 1.2.3 ' }), {
      params: Promise.resolve({ platform: 'ios' }),
    })) as any

    expect(response.status).toBe(400)
    expect(mockSavePlatform).not.toHaveBeenCalled()
  })

  it.each([['a number', 123], ['an array', ['1.2.3']], ['an object', { v: '1.2.3' }]])(
    'rejects a version that is %s instead of a string',
    async (_label, version) => {
      mockGetPlatform.mockResolvedValue({ name: 'ios', versions: ['1.0.0'] })

      const response = (await POST(makePostRequest({ version }), {
        params: Promise.resolve({ platform: 'ios' }),
      })) as any

      expect(response.status).toBe(400)
      expect(mockSavePlatform).not.toHaveBeenCalled()
    }
  )

  it('rejects a missing version field', async () => {
    mockGetPlatform.mockResolvedValue({ name: 'ios', versions: ['1.0.0'] })

    const response = (await POST(makePostRequest({}), {
      params: Promise.resolve({ platform: 'ios' }),
    })) as any

    expect(response.status).toBe(400)
    expect((await response.json())).toEqual({ error: 'Missing "version" in body' })
  })
})
