import '../../scripts/env.mjs'
import { getMigrations } from 'better-auth/db/migration'

const { authOptions } = await import('@/server/auth-config')
const { runMigrations } = await getMigrations(authOptions)
await runMigrations()
console.log('Authentication database is up to date')
process.exit(0)
