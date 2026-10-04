import { type Account, type BetterAuthOptions, type GenericEndpointContext } from 'better-auth'
import { getMigrations } from 'better-auth/db/migration'
import { genericOAuth } from 'better-auth/plugins'
import Database from 'better-sqlite3'
import { createHash } from 'crypto'
import { mkdirSync } from 'fs'
import { dirname } from 'path'
import { mapOidcProfile } from '@/lib/oidcProfile'
import {
  OIDC_PROVIDER_ID,
  readOidcSettings,
  rememberPendingRole,
  takePendingRole,
} from '@/lib/oidc'

const authDbPath = process.env.AUTH_DB_PATH || './data/auth.db'
mkdirSync(dirname(authDbPath), { recursive: true })
const db = new Database(authDbPath)

const isDev = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'
const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const socialProviders =
  googleClientId && googleClientSecret
    ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      }
    : undefined

const safeLocalFallbacks = isDev || isTest
const localBuildSecret = createHash('sha256')
  .update('paramtune local development and build only secret')
  .digest('base64')
const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.BETTER_AUTH_BASE_URL ||
  process.env.PORTLESS_URL ||
  (safeLocalFallbacks ? 'http://localhost:3000' : undefined)
const secret =
  process.env.BETTER_AUTH_SECRET ||
  (safeLocalFallbacks ? localBuildSecret : undefined)

if (!baseURL || !secret) {
  throw new Error('BETTER_AUTH_URL and BETTER_AUTH_SECRET are required in production')
}

const oidc = readOidcSettings()

// Handstamp (or any OIDC provider). The provider ID is the generic 'oidc' so a
// different IdP only means different env vars.
const oidcPlugins = oidc
  ? [
      genericOAuth({
        config: [
          {
            providerId: OIDC_PROVIDER_ID,
            name: oidc.displayName,
            discoveryUrl: oidc.discoveryUrl,
            clientId: oidc.clientId,
            clientSecret: oidc.clientSecret,
            scopes: oidc.scopes,
            // The callback URI registered with the provider. Better Auth 1.7
            // serves it at /api/auth/callback/oidc; the oauth2 route forwards.
            redirectURI: baseURL ? `${baseURL}/api/auth/oauth2/callback/${OIDC_PROVIDER_ID}` : undefined,
            // RP-initiated logout: signOut() returns the end_session_endpoint
            // URL with id_token_hint, client_id and this redirect.
            postLogoutRedirectURI: '/',
            // client_secret_basic, Handstamp's default for server apps
            authentication: 'basic',
            pkce: true,
            requireIdTokenVerification: true,
            // Refresh name, email and role at every sign-in
            overrideUserInfo: true,
            mapProfileToUser: (profile) => {
              const user = mapOidcProfile(profile, oidc)
              if (profile.sub != null) rememberPendingRole(String(profile.sub), user.role)
              return user
            },
          },
        ],
      }),
    ]
  : []

async function applyOidcRole(account: Account | null, ctx: GenericEndpointContext | null) {
  if (!account || account.providerId !== OIDC_PROVIDER_ID || !ctx) return
  const role = takePendingRole(account.accountId)
  if (role) await ctx.context.internalAdapter.updateUser(account.userId, { role })
}

export const authOptions = {
  database: db,
  baseURL,
  secret,
  socialProviders,
  emailAndPassword: isDev ? { enabled: true } : undefined,
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'member', input: false },
    },
  },
  // Never link accounts by email: accounts are keyed on (providerId, sub)
  account: { accountLinking: { enabled: false } },
  databaseHooks: {
    account: {
      create: { after: applyOidcRole },
      update: { after: applyOidcRole },
    },
  },
  plugins: oidcPlugins,
} satisfies BetterAuthOptions

export const oidcSettings = oidc

export async function migrateAuth() {
  const { runMigrations } = await getMigrations(authOptions)
  await runMigrations()
}
