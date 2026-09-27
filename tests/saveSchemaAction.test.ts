import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuth = vi.hoisted(() => ({
  api: { getSession: vi.fn() },
}))
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockHeaders = vi.hoisted(() => vi.fn())
vi.mock('next/headers', () => ({ headers: mockHeaders }))

const mockSaveSchema = vi.hoisted(() => vi.fn())
vi.mock('@/models/Schema', () => ({
  saveSchema: mockSaveSchema,
}))

const mockLogAudit = vi.hoisted(() => vi.fn())
vi.mock('@/lib/auditLog', () => ({ logAudit: mockLogAudit }))

import { saveSchemaContent } from '@/actions/saveSchema'

describe('saveSchemaContent action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHeaders.mockResolvedValue(new Headers())
  })

  it('throws when there is no session, without saving or logging', async () => {
    mockAuth.api.getSession.mockResolvedValue(null)

    await expect(
      saveSchemaContent('ios', '1.0.0', { foo: 'bar' })
    ).rejects.toThrow('Unauthorized')
    expect(mockSaveSchema).not.toHaveBeenCalled()
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  it('rejects an invalid platform name, without saving or logging', async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
    })

    await expect(
      saveSchemaContent('ios/../etc', '1.0.0', { foo: 'bar' })
    ).rejects.toThrow('Invalid platform name')
    expect(mockSaveSchema).not.toHaveBeenCalled()
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  it('rejects an invalid version name, without saving or logging', async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
    })

    await expect(
      saveSchemaContent('ios', 'not a version', { foo: 'bar' })
    ).rejects.toThrow('Invalid version name')
    expect(mockSaveSchema).not.toHaveBeenCalled()
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  it('rejects a missing platform name instead of throwing a TypeError, without saving or logging', async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
    })

    // Mirrors a direct server-action call sending a non-string platform,
    // which a form-derived caller would normally coerce to a string first.
    await expect(
      saveSchemaContent(null as unknown as string, '1.0.0', { foo: 'bar' })
    ).rejects.toThrow('Invalid platform name')
    expect(mockSaveSchema).not.toHaveBeenCalled()
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  it('rejects a missing version name instead of throwing a TypeError, without saving or logging', async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
    })

    await expect(
      saveSchemaContent('ios', null as unknown as string, { foo: 'bar' })
    ).rejects.toThrow('Invalid version name')
    expect(mockSaveSchema).not.toHaveBeenCalled()
    expect(mockLogAudit).not.toHaveBeenCalled()
  })

  it('saves the schema content with the session author when a session exists', async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
    })

    const content = { foo: 'bar' }
    await saveSchemaContent('ios', '1.0.0', content)

    expect(mockSaveSchema).toHaveBeenCalledWith('ios', '1.0.0', content, {
      id: 'u1',
      name: 'Alice',
      image: undefined,
    })
  })

  it('records an "update" audit entry for the platform, version, and user', async () => {
    mockAuth.api.getSession.mockResolvedValue({
      user: { id: 'u1', email: 'a@b.com', name: 'Alice' },
    })

    await saveSchemaContent('ios', '1.0.0', { foo: 'bar' })

    expect(mockLogAudit).toHaveBeenCalledWith({
      action: 'update',
      platform: 'ios',
      version: '1.0.0',
      userEmail: 'a@b.com',
      userId: 'u1',
    })
  })

  it('falls back to "Unknown" name and "unknown" email/id when the session omits them', async () => {
    mockAuth.api.getSession.mockResolvedValue({ user: {} })

    await saveSchemaContent('ios', '1.0.0', { foo: 'bar' })

    expect(mockSaveSchema).toHaveBeenCalledWith('ios', '1.0.0', { foo: 'bar' }, {
      id: undefined,
      name: 'Unknown',
      image: undefined,
    })
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({ userEmail: 'unknown', userId: 'unknown' })
    )
  })
})
