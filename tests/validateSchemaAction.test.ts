import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockAuth = vi.hoisted(() => ({
  api: { getSession: vi.fn() },
}))
vi.mock('@/lib/auth', () => ({ auth: mockAuth }))

const mockHeaders = vi.hoisted(() => vi.fn())
vi.mock('next/headers', () => ({ headers: mockHeaders }))

const mockValidateSchemaContentInternal = vi.hoisted(() => vi.fn())
vi.mock('@/models/Schema', () => ({
  validateSchemaContent: mockValidateSchemaContentInternal,
}))

import { validateSchemaContent } from '@/actions/validateSchema'

describe('validateSchemaContent action', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHeaders.mockResolvedValue(new Headers())
  })

  it('throws when there is no session, without validating the content', async () => {
    mockAuth.api.getSession.mockResolvedValue(null)

    await expect(validateSchemaContent({})).rejects.toThrow('Unauthorized')
    expect(mockValidateSchemaContentInternal).not.toHaveBeenCalled()
  })

  it('validates the content when a session exists', async () => {
    mockAuth.api.getSession.mockResolvedValue({ user: { id: 'u1' } })
    mockValidateSchemaContentInternal.mockResolvedValue({ valid: true, errors: [] })

    const content = { foo: 'bar' }
    const result = await validateSchemaContent(content)

    expect(mockValidateSchemaContentInternal).toHaveBeenCalledWith(content)
    expect(result).toEqual({ valid: true, errors: [] })
  })
})
