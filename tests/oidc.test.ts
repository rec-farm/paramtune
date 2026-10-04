import { describe, expect, it, vi } from 'vitest'
import {
  mapOidcProfile,
  readOidcSettings,
  rememberPendingRole,
  roleFromClaims,
  takePendingRole,
} from '@/lib/oidc'

const settings = { rolesClaim: 'groups', adminGroup: 'paramtune-admins' }

describe('readOidcSettings', () => {
  it('is disabled without an issuer or client id', () => {
    expect(readOidcSettings({})).toBeNull()
    expect(readOidcSettings({ OIDC_ISSUER: 'https://id.rec.farm' })).toBeNull()
    expect(readOidcSettings({ OIDC_CLIENT_ID: 'paramtune' })).toBeNull()
    expect(readOidcSettings({ OIDC_ISSUER: ' ', OIDC_CLIENT_ID: 'paramtune' })).toBeNull()
  })

  it('applies the documented defaults', () => {
    expect(readOidcSettings({ OIDC_ISSUER: 'https://id.rec.farm/', OIDC_CLIENT_ID: 'paramtune' })).toEqual({
      issuer: 'https://id.rec.farm',
      discoveryUrl: 'https://id.rec.farm/.well-known/openid-configuration',
      clientId: 'paramtune',
      clientSecret: undefined,
      scopes: ['openid', 'profile', 'email', 'groups'],
      rolesClaim: 'groups',
      adminGroup: undefined,
      displayName: 'Handstamp',
    })
  })

  it('reads every variable', () => {
    const result = readOidcSettings({
      OIDC_ISSUER: 'https://id.example.com',
      OIDC_CLIENT_ID: 'paramtune',
      OIDC_CLIENT_SECRET: 'hs_sec_x',
      OIDC_SCOPES: 'openid  email',
      OIDC_ROLES_CLAIM: 'roles',
      OIDC_ADMIN_GROUP: 'admins',
      OIDC_DISPLAY_NAME: 'Example ID',
    })
    expect(result).toMatchObject({
      clientSecret: 'hs_sec_x',
      scopes: ['openid', 'email'],
      rolesClaim: 'roles',
      adminGroup: 'admins',
      displayName: 'Example ID',
    })
  })
})

describe('roleFromClaims', () => {
  it('promotes members of the admin group', () => {
    expect(roleFromClaims({ groups: ['staff', 'paramtune-admins'] }, settings)).toBe('admin')
  })

  it('keeps everyone else a member', () => {
    expect(roleFromClaims({ groups: ['staff'] }, settings)).toBe('member')
    expect(roleFromClaims({}, settings)).toBe('member')
    expect(roleFromClaims({ groups: 'paramtune-admins' }, settings)).toBe('member')
    expect(roleFromClaims({ groups: [{ name: 'paramtune-admins' }] }, settings)).toBe('member')
  })

  it('promotes nobody without an admin group', () => {
    expect(roleFromClaims({ groups: ['paramtune-admins'] }, { rolesClaim: 'groups', adminGroup: undefined })).toBe('member')
  })

  it('reads the configured claim', () => {
    expect(roleFromClaims({ roles: ['paramtune-admins'] }, { ...settings, rolesClaim: 'roles' })).toBe('admin')
    expect(roleFromClaims({ groups: ['paramtune-admins'] }, { ...settings, rolesClaim: 'roles' })).toBe('member')
  })
})

describe('mapOidcProfile', () => {
  it('maps name, email and role', () => {
    expect(
      mapOidcProfile({ sub: 's1', name: 'Ada', email: 'ada@example.com', groups: ['paramtune-admins'] }, settings),
    ).toEqual({ name: 'Ada', email: 'ada@example.com', role: 'admin' })
  })

  it('falls back to preferred_username, then email, for the name', () => {
    expect(mapOidcProfile({ preferred_username: 'ada', email: 'ada@example.com' }, settings).name).toBe('ada')
    expect(mapOidcProfile({ email: 'ada@example.com' }, settings).name).toBe('ada@example.com')
  })
})

describe('pending roles', () => {
  it('hands a role over once', () => {
    rememberPendingRole('sub-1', 'admin')
    expect(takePendingRole('sub-1')).toBe('admin')
    expect(takePendingRole('sub-1')).toBeUndefined()
  })

  it('expires roles nobody picked up', () => {
    vi.useFakeTimers()
    try {
      rememberPendingRole('sub-2', 'admin')
      vi.advanceTimersByTime(6 * 60 * 1000)
      expect(takePendingRole('sub-2')).toBeUndefined()
    } finally {
      vi.useRealTimers()
    }
  })
})
