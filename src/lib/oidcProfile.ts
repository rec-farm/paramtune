// Server-only: maps the provider's profile to the Better Auth user. Kept apart
// from oidc.ts, which client components import, because it needs node:crypto.
import { createHash } from 'crypto'
import { roleFromClaims, stringClaim, type OidcSettings } from '@/lib/oidc'

// Better Auth needs an email to create a user, but a Handstamp account may
// have none (passkey only). Such accounts get an address under the reserved
// .invalid TLD: never deliverable, never verified, and replaced by the real one
// at the next sign-in once the account has one. The local part is a hash of the
// subject, so different subjects can never share an address.
export function placeholderEmail(subject: string, issuer: string) {
  const id = createHash('sha256').update(subject).digest('hex')
  return `${id}@${new URL(issuer).hostname}.invalid`
}

export function mapOidcProfile(
  profile: Record<string, unknown>,
  settings: Pick<OidcSettings, 'issuer' | 'rolesClaim' | 'adminGroup'>,
) {
  const email = stringClaim(profile.email)
  const subject = stringClaim(profile.sub)
  return {
    name: stringClaim(profile.name) ?? stringClaim(profile.preferred_username) ?? email ?? '',
    email: email ?? (subject ? placeholderEmail(subject, settings.issuer) : undefined),
    // Better Auth reads `emailVerified`; OIDC sends `email_verified`
    emailVerified: email !== undefined && profile.email_verified === true,
    role: roleFromClaims(profile, settings),
  }
}
