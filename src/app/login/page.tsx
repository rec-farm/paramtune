import { connection } from 'next/server'
import { readOidcSettings } from '@/lib/oidc'
import LoginForm from './LoginForm'

// The Docker image is built once and configured at runtime, so whether the
// OIDC button shows (and its label) is read per request, not at build time.
export default async function LoginPage() {
  await connection()
  const oidc = readOidcSettings()

  return <LoginForm oidc={oidc ? { label: oidc.displayName } : null} />
}
