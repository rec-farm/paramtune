import { betterAuth } from 'better-auth'
import { nextCookies } from 'better-auth/next-js'
import Database from 'better-sqlite3'

const db = new Database('./data/auth.db')

const isDev = process.env.NODE_ENV === 'development'

export const auth = betterAuth({
  database: db,
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'fake-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'fake-client-secret',
    },
  },
  emailAndPassword: isDev ? { enabled: true } : undefined,
  plugins: [nextCookies()],
})
