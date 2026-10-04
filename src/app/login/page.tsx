import { connection } from 'next/server'
import { readOidcSettings } from '@/lib/oidc'
import LoginForm from './LoginForm'

// The Docker image is built once and configured at runtime, so whether the
// OIDC button shows (and its label) is read per request, not at build time.
export default async function LoginPage() {
  await connection()
  const oidc = readOidcSettings()
  // Matches the condition in auth.ts: Google is only registered with both values
  const google = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

  return <LoginForm oidc={oidc ? { label: oidc.displayName } : null} google={google} />
}
