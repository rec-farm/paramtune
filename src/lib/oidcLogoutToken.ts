import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'
import type { OidcSettings } from '@/lib/oidc'

export const BACKCHANNEL_LOGOUT_EVENT = 'http://schemas.openid.net/event/backchannel-logout'

export class LogoutTokenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LogoutTokenError'
  }
}

export interface LogoutTokenOptions {
  issuer: string
  audience: string
  jwks: JWTVerifyGetKey
}

// OpenID Connect Back-Channel Logout 1.0, section 2.6: a logout token is an ID
// token minus the nonce, plus the back-channel logout event.
export async function verifyLogoutToken(token: string, options: LogoutTokenOptions) {
  let payload
  try {
    ;({ payload } = await jwtVerify(token, options.jwks, {
      issuer: options.issuer,
      audience: options.audience,
      requiredClaims: ['iat'],
      maxTokenAge: '10m',
      clockTolerance: 30,
    }))
  } catch (error) {
    throw new LogoutTokenError(error instanceof Error ? error.message : 'Invalid logout token')
  }

  const events = payload.events
  if (
    !events ||
    typeof events !== 'object' ||
    Array.isArray(events) ||
    typeof (events as Record<string, unknown>)[BACKCHANNEL_LOGOUT_EVENT] !== 'object'
  ) {
    throw new LogoutTokenError('Missing back-channel logout event')
  }
  if ('nonce' in payload) {
    throw new LogoutTokenError('Logout token must not contain a nonce')
  }
  if (typeof payload.sub !== 'string' || !payload.sub) {
    throw new LogoutTokenError('Logout token has no sub')
  }

  return {
    sub: payload.sub,
    sid: typeof payload.sid === 'string' ? payload.sid : undefined,
  }
}

interface DiscoveryDocument {
  issuer: string
  jwks_uri: string
}

let discovery: Promise<DiscoveryDocument> | undefined
let remoteJwks: { uri: string; getKey: JWTVerifyGetKey } | undefined

async function fetchDiscovery(settings: OidcSettings): Promise<DiscoveryDocument> {
  const response = await fetch(settings.discoveryUrl, { headers: { accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`OIDC discovery failed with ${response.status}`)
  }
  const document = (await response.json()) as Partial<DiscoveryDocument>
  if (!document.issuer || !document.jwks_uri) {
    throw new Error('OIDC discovery has no issuer or jwks_uri')
  }
  return { issuer: document.issuer, jwks_uri: document.jwks_uri }
}

// The discovery document is fetched once; jose's remote JWKS caches keys and
// refetches on an unknown kid, which covers Handstamp's key rotation.
export async function verifyLogoutTokenWithDiscovery(token: string, settings: OidcSettings) {
  discovery ??= fetchDiscovery(settings).catch((error) => {
    discovery = undefined
    throw error
  })
  const { issuer, jwks_uri } = await discovery
  if (remoteJwks?.uri !== jwks_uri) {
    remoteJwks = { uri: jwks_uri, getKey: createRemoteJWKSet(new URL(jwks_uri, settings.discoveryUrl)) }
  }
  return verifyLogoutToken(token, { issuer, audience: settings.clientId, jwks: remoteJwks.getKey })
}
