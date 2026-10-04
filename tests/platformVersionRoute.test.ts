import { beforeEach, describe, expect, it, vi } from 'vitest'


const mockAuth = vi.hoisted(() => ({
  api: { getSession: vi.fn() },
}))
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockGetVersion = vi.hoisted(() => vi.fn())
vi.mock('@/models/Version', () => ({ getVersion: mockGetVersion }))

import { GET } from '@/server/routes/version'

function makeRequest() {
  return { headers: new Headers() } as unknown as Request
}

function get(platform: string, version: string) {
  return GET(makeRequest(), {
    params: Promise.resolve({ platform, version }),
  }) as any
}

describe('GET /api/[platform]/[version]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.api.getSession.mockResolvedValue({ user: { id: 'u1', email: 'a@b.com' } })
  })

  it('returns the version content when it exists', async () => {
    mockGetVersion.mockResolvedValue({ content: '{}' })

    const response = await get('ios', '1.2.3')

    expect(response.status).toBe(200)
    expect((await response.json())).toEqual({ content: '{}' })
  })

  it('reads back a version with build metadata that POST /versions accepts', async () => {
    // The bug this route pairs with: POST /api/[platform]/versions accepts
    // "1.2.3+build.5" (valid semver), but this route used to validate the
    // version as a generic name, whose charset excludes "+" — so the version
    // could be created and listed but never fetched.
    mockGetVersion.mockResolvedValue({ content: '{}' })

    const response = await get('ios', '1.2.3+build.5')

    expect(response.status).toBe(200)
    expect(mockGetVersion).toHaveBeenCalledWith('ios', '1.2.3+build.5')
  })

  it('decodes a percent-encoded plus sign from the URL', async () => {
    // Links are built with encodeURIComponent, which encodes "+" as "%2B".
    mockGetVersion.mockResolvedValue({ content: '{}' })

    const response = await get('ios', '1.2.3%2Bbuild.5')

    expect(response.status).toBe(200)
    expect(mockGetVersion).toHaveBeenCalledWith('ios', '1.2.3+build.5')
  })

  it('returns 404 when the version does not exist', async () => {
    mockGetVersion.mockResolvedValue(null)

    const response = await get('ios', '9.9.9')

    expect(response.status).toBe(404)
    expect((await response.json())).toEqual({ error: 'Version not found' })
  })

  it('still looks up a non-semver version rather than rejecting it', async () => {
    // Read paths stay permissive so versions stored before semver validation
    // existed resolve to a 404 (or their content) instead of a 400.
    mockGetVersion.mockResolvedValue(null)

    const response = await get('ios', 'legacy-build')

    expect(response.status).toBe(404)
    expect(mockGetVersion).toHaveBeenCalledWith('ios', 'legacy-build')
  })

  it('rejects a version containing a slash with 400 and never hits Redis', async () => {
    const response = await get('ios', '..%2Fsecret')

    expect(response.status).toBe(400)
    expect(mockGetVersion).not.toHaveBeenCalled()
  })

  it('rejects a version containing spaces with 400', async () => {
    const response = await get('ios', '1.2.3%20')

    expect(response.status).toBe(400)
    expect(mockGetVersion).not.toHaveBeenCalled()
  })

  it('rejects an over-long version with 400', async () => {
    const response = await get('ios', 'a'.repeat(129))

    expect(response.status).toBe(400)
    expect(mockGetVersion).not.toHaveBeenCalled()
  })
})
