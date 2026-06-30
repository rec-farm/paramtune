import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/connections/redis')
import mockRedis from '@/connections/__mocks__/redis'

import { logAudit } from '@/lib/auditLog'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('logAudit', () => {
  it('stores an audit entry as JSON with an auto-generated timestamp', async () => {
    await logAudit({
      action: 'create',
      platform: 'ios',
      userEmail: 'user@example.com',
      userId: 'u1',
    })

    expect(mockRedis.lpush).toHaveBeenCalledOnce()
    const [key, json] = mockRedis.lpush.mock.calls[0] as [string, string]
    expect(key).toBe('audit:log')
    const entry = JSON.parse(json)
    expect(entry.action).toBe('create')
    expect(entry.platform).toBe('ios')
    expect(entry.userEmail).toBe('user@example.com')
    expect(entry.userId).toBe('u1')
    expect(typeof entry.timestamp).toBe('string')
    expect(new Date(entry.timestamp).getTime()).not.toBeNaN()
  })

  it('includes the optional version field when provided', async () => {
    await logAudit({
      action: 'update',
      platform: 'android',
      version: '2.0.0',
      userEmail: 'admin@example.com',
      userId: 'u2',
    })

    const json = mockRedis.lpush.mock.calls[0][1] as string
    expect(JSON.parse(json).version).toBe('2.0.0')
  })

  it('omits version from the stored entry when not provided', async () => {
    await logAudit({
      action: 'delete',
      platform: 'web',
      userEmail: 'user@example.com',
      userId: 'u3',
    })

    const json = mockRedis.lpush.mock.calls[0][1] as string
    expect(Object.prototype.hasOwnProperty.call(JSON.parse(json), 'version')).toBe(false)
  })

  it('caps the list at MAX_AUDIT_ENTRIES (1000) via ltrim', async () => {
    await logAudit({
      action: 'create',
      platform: 'web',
      userEmail: 'user@example.com',
      userId: 'u4',
    })

    expect(mockRedis.ltrim).toHaveBeenCalledWith('audit:log', 0, 999)
  })

  it('executes lpush and ltrim in a single pipeline call', async () => {
    await logAudit({
      action: 'update',
      platform: 'ios',
      userEmail: 'user@example.com',
      userId: 'u5',
    })

    expect(mockRedis.pipeline).toHaveBeenCalledOnce()
    expect(mockRedis.lpush).toHaveBeenCalledOnce()
    expect(mockRedis.ltrim).toHaveBeenCalledOnce()
  })
})
