import { betterAuth } from 'better-auth'
import { authOptions } from '@/server/auth-config'
export { oidcSettings } from '@/server/auth-config'

export const auth = betterAuth(authOptions)
