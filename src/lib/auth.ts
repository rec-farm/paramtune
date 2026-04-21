import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import Database from 'better-sqlite3'
import { createHash } from 'crypto'
import { mkdirSync } from 'fs'
import { dirname } from 'path'

const authDbPath = process.env.AUTH_DB_PATH || './data/auth.db'
mkdirSync(dirname(authDbPath), { recursive: true })
const db = new Database(authDbPath)

const isDev = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'
const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build'
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

const safeLocalFallbacks = isDev || isTest || isProductionBuild
const localBuildSecret = createHash('sha256')
  .update('paramtune local development and build only secret')
  .digest('base64')
const baseURL =
  process.env.BETTER_AUTH_URL ||
  process.env.BETTER_AUTH_BASE_URL ||
  (safeLocalFallbacks ? 'http://localhost:3000' : undefined)
const secret =
  process.env.BETTER_AUTH_SECRET ||
  (safeLocalFallbacks ? localBuildSecret : undefined)

export const auth = betterAuth({
  database: db,
  baseURL,
  secret,
  socialProviders,
  emailAndPassword: isDev ? { enabled: true } : undefined,
  plugins: [nextCookies()],
})
