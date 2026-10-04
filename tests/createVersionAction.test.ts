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
  MissingPlatformError: class MissingPlatformError extends Error {
    constructor(props: { platform: string }) {
      super(`Platform not found: ${props.platform}`)
    }
  },
}))

const mockLogAudit = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auditLog', () => ({ logAudit: mockLogAudit }))

import { createPlatformVersion } from '@/server/services/createVersion'

describe('createPlatformVersion action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.api.getSession.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com' },
    })
  })

  it('throws when there is no session, without saving or logging', async () => {
    mockAuth.api.getSession.mockResolvedValue(null)

    await expect(createPlatformVersion(new Headers(), 'ios', '1.0.0')).rejects.toThrow(
      'Unauthorized'
    )
    expect(mockSavePlatform).not.toHaveBeenCalled()
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  it('rejects an invalid platform name, without saving or logging', async () => {
    await expect(
      createPlatformVersion(new Headers(), 'ios/../etc', '1.0.0')
    ).rejects.toThrow('Invalid platform name')
    expect(mockGetPlatform).not.toHaveBeenCalled()
    expect(mockSavePlatform).not.toHaveBeenCalled()
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  it('rejects a missing platform name instead of throwing a TypeError, without saving or logging', async () => {
    // Mirrors formData.get('platform') returning null when the field is
    // absent, which a direct server-action call can send without the cast
    // the dashboard page applies.
    await expect(
      createPlatformVersion(new Headers(), null as unknown as string, '1.0.0')
    ).rejects.toThrow('Invalid platform name')
    expect(mockGetPlatform).not.toHaveBeenCalled()
    expect(mockSavePlatform).not.toHaveBeenCalled()
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  it('throws when the platform does not exist', async () => {
    mockGetPlatform.mockResolvedValue(null)

    await expect(createPlatformVersion(new Headers(), 'nonexistent', '1.0.0')).rejects.toThrow()
    expect(mockSavePlatform).not.toHaveBeenCalled()
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  it('rejects a version that is not valid semver, without saving or logging', async () => {
    mockGetPlatform.mockResolvedValue({ name: 'ios', versions: ['1.0.0'] })

    await expect(
      createPlatformVersion(new Headers(), 'ios', 'not-a-version')
    ).rejects.toThrow('must be a valid semantic version')
    expect(mockSavePlatform).not.toHaveBeenCalled()
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  it('rejects a missing version name instead of throwing a TypeError, without saving or logging', async () => {
    mockGetPlatform.mockResolvedValue({ name: 'ios', versions: ['1.0.0'] })

    // Mirrors formData.get('versionName') returning null when the field is
    // absent, which the caller casts to `string` without checking.
    await expect(
      createPlatformVersion(new Headers(), 'ios', null as unknown as string)
    ).rejects.toThrow('must be a valid semantic version')
    expect(mockSavePlatform).not.toHaveBeenCalled()
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  it('adds the version and records a "create" audit entry', async () => {
    mockGetPlatform.mockResolvedValue({ name: 'ios', versions: ['1.0.0'] })
    mockSavePlatform.mockResolvedValue(undefined)

    await createPlatformVersion(new Headers(), 'ios', '2.0.0')

    expect(mockSavePlatform).toHaveBeenCalledWith('ios', {
      name: 'ios',
      versions: ['1.0.0', '2.0.0'],
    })
    expect(mockLogAudit).toHaveBeenCalledWith({
      action: 'create',
      platform: 'ios',
      version: '2.0.0',
      userEmail: 'a@b.com',
      userId: 'u1',
    })
  })
})
