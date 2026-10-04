import { beforeAll, describe, expect, it } from 'vitest'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTPayload, type JWTVerifyGetKey } from 'jose'
import { BACKCHANNEL_LOGOUT_EVENT, LogoutTokenError, verifyLogoutToken } from '@/lib/oidcLogoutToken'

const issuer = 'https://id.example.com'
const audience = 'paramtune'

let privateKey: CryptoKey
let otherKey: CryptoKey
let jwks: JWTVerifyGetKey

beforeAll(async () => {
  const pair = await generateKeyPair('RS256')
  privateKey = pair.privateKey
  otherKey = (await generateKeyPair('RS256')).privateKey
  const jwk = await exportJWK(pair.publicKey)
  jwks = createLocalJWKSet({ keys: [{ ...jwk, kid: 'k1', alg: 'RS256', use: 'sig' }] })
})

function sign(payload: JWTPayload, { key = privateKey, kid = 'k1' } = {}) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'RS256', kid, typ: 'logout+jwt' })
    .sign(key)
}

function validClaims(overrides: JWTPayload = {}): JWTPayload {
  return {
    iss: issuer,
    aud: audience,
    sub: 'user-sub',
    sid: 'session-1',
    iat: Math.floor(Date.now() / 1000),
    jti: 'jti-1',
    events: { [BACKCHANNEL_LOGOUT_EVENT]: {} },
    ...overrides,
  }
}

const verify = (token: string) => verifyLogoutToken(token, { issuer, audience, jwks })

describe('verifyLogoutToken', () => {
  it('accepts a valid logout token', async () => {
    await expect(verify(await sign(validClaims()))).resolves.toEqual({ sub: 'user-sub', sid: 'session-1' })
  })

  it('rejects a token signed by another key', async () => {
    await expect(verify(await sign(validClaims(), { key: otherKey }))).rejects.toBeInstanceOf(LogoutTokenError)
  })

  it('rejects a token with an unknown kid', async () => {
    await expect(verify(await sign(validClaims(), { kid: 'nope' }))).rejects.toBeInstanceOf(LogoutTokenError)
  })

  it('rejects the wrong issuer', async () => {
    await expect(verify(await sign(validClaims({ iss: 'https://evil.example.com' })))).rejects.toThrow(LogoutTokenError)
  })

  it('rejects the wrong audience', async () => {
    await expect(verify(await sign(validClaims({ aud: 'someone-else' })))).rejects.toThrow(LogoutTokenError)
  })

  it('requires iat', async () => {
    await expect(verify(await sign(validClaims({ iat: undefined })))).rejects.toThrow(LogoutTokenError)
  })

  it('rejects stale and future tokens', async () => {
    const now = Math.floor(Date.now() / 1000)
    await expect(verify(await sign(validClaims({ iat: now - 3600 })))).rejects.toThrow(LogoutTokenError)
    await expect(verify(await sign(validClaims({ iat: now + 3600 })))).rejects.toThrow(LogoutTokenError)
  })

  it('rejects an expired token', async () => {
    const now = Math.floor(Date.now() / 1000)
    await expect(verify(await sign(validClaims({ iat: now - 120, exp: now - 60 })))).rejects.toThrow(LogoutTokenError)
  })

  it('requires the back-channel logout event', async () => {
    await expect(verify(await sign(validClaims({ events: undefined })))).rejects.toThrow('Missing back-channel logout event')
    await expect(verify(await sign(validClaims({ events: { 'http://example.com/other': {} } })))).rejects.toThrow(
      'Missing back-channel logout event',
    )
    await expect(verify(await sign(validClaims({ events: { [BACKCHANNEL_LOGOUT_EVENT]: 'yes' } })))).rejects.toThrow(
      'Missing back-channel logout event',
    )
  })

  it('rejects a token carrying a nonce (an ID token)', async () => {
    await expect(verify(await sign(validClaims({ nonce: 'n' })))).rejects.toThrow('must not contain a nonce')
  })

  it('requires sub', async () => {
    await expect(verify(await sign(validClaims({ sub: undefined })))).rejects.toThrow('has no sub')
  })

  it('rejects garbage', async () => {
    await expect(verify('not-a-jwt')).rejects.toBeInstanceOf(LogoutTokenError)
  })
})
