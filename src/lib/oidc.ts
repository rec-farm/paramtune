// Settings and claim mapping for "Sign in with <OIDC_DISPLAY_NAME>". Kept free
// of Better Auth imports so the login page and tests can use it on their own.

export const OIDC_PROVIDER_ID = 'oidc'

export type UserRole = 'admin' | 'member'

export interface OidcSettings {
  issuer: string
  discoveryUrl: string
  clientId: string
  clientSecret: string | undefined
  scopes: string[]
  rolesClaim: string
  adminGroup: string | undefined
  displayName: string
}

type Env = Record<string, string | undefined>

function nonEmpty(value: string | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

// Returns null when OIDC_ISSUER or OIDC_CLIENT_ID is empty: the button is then
// hidden and the other sign-in methods keep working.
export function readOidcSettings(env: Env = process.env): OidcSettings | null {
  const issuer = nonEmpty(env.OIDC_ISSUER)?.replace(/\/+$/, '')
  const clientId = nonEmpty(env.OIDC_CLIENT_ID)
  if (!issuer || !clientId) {
    return null
  }

  return {
    issuer,
    discoveryUrl: `${issuer}/.well-known/openid-configuration`,
    clientId,
    clientSecret: nonEmpty(env.OIDC_CLIENT_SECRET),
    scopes: (nonEmpty(env.OIDC_SCOPES) ?? 'openid profile email groups').split(/\s+/),
    rolesClaim: nonEmpty(env.OIDC_ROLES_CLAIM) ?? 'groups',
    adminGroup: nonEmpty(env.OIDC_ADMIN_GROUP),
    displayName: nonEmpty(env.OIDC_DISPLAY_NAME) ?? 'Handstamp',
  }
}

export function roleFromClaims(
  claims: Record<string, unknown>,
  settings: Pick<OidcSettings, 'rolesClaim' | 'adminGroup'>,
): UserRole {
  const value = claims[settings.rolesClaim]
  const groups = Array.isArray(value) ? value.filter((group) => typeof group === 'string') : []
  return settings.adminGroup && groups.includes(settings.adminGroup) ? 'admin' : 'member'
}

function stringClaim(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : undefined
}

export function mapOidcProfile(
  profile: Record<string, unknown>,
  settings: Pick<OidcSettings, 'rolesClaim' | 'adminGroup'>,
) {
  const email = stringClaim(profile.email)
  return {
    name: stringClaim(profile.name) ?? stringClaim(profile.preferred_username) ?? email ?? '',
    email,
    role: roleFromClaims(profile, settings),
  }
}

// Better Auth drops `input: false` fields (role) from what mapProfileToUser
// returns, the same rule that keeps clients from setting them. So the mapped
// role is parked here under the account's subject and written by the account
// hooks in auth.ts, which run later in the same callback request.
const PENDING_ROLE_TTL_MS = 5 * 60 * 1000
const pendingRoles = new Map<string, { role: UserRole; expiresAt: number }>()

export function rememberPendingRole(subject: string, role: UserRole) {
  const now = Date.now()
  for (const [key, entry] of pendingRoles) {
    if (entry.expiresAt < now) pendingRoles.delete(key)
  }
  pendingRoles.set(subject, { role, expiresAt: now + PENDING_ROLE_TTL_MS })
}

export function takePendingRole(subject: string): UserRole | undefined {
  const entry = pendingRoles.get(subject)
  pendingRoles.delete(subject)
  return entry && entry.expiresAt >= Date.now() ? entry.role : undefined
}
