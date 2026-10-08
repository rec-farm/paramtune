import { useEffect, useState } from 'react'
import { OIDC_PROVIDER_ID } from '@/shared/auth'

// Browser client for the Rust auth routes in backend/src/auth.rs

export interface Session {
  user: { id: string, name: string, email: string, image?: string | null, role?: string }
  session: { id: string, expiresAt: string }
}

const JSON_HEADERS = { 'Content-Type': 'application/json' }

export function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [isPending, setPending] = useState(true)
  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/auth/get-session', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Session lookup failed')
        setSession(await response.json() as Session | null)
      })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setPending(false) })
    return () => controller.abort()
  }, [])
  return { session, isPending }
}

// Leaves for the OIDC provider on success; resolves with an error message otherwise
export async function signIn(returnTo: string): Promise<string | null> {
  const response = await fetch('/api/auth/sign-in/social', {
    method: 'POST',
    headers: JSON_HEADERS,
    body: JSON.stringify({ provider: OIDC_PROVIDER_ID, callbackURL: returnTo }),
  })
  const result = await response.json() as { url?: string, error?: string }
  if (!response.ok || !result.url) return result.error || 'Sign-in failed'
  window.location.assign(result.url)
  return null
}

export async function signOut() {
  const response = await fetch('/api/auth/sign-out', { method: 'POST', headers: JSON_HEADERS, body: '{}' })
  if (!response.ok) throw new Error('Sign-out failed')
  const result = await response.json() as { url?: string }
  window.location.assign(result.url || '/login')
}

// Only available outside production
export async function devLogin() {
  const response = await fetch('/api/auth/dev-login', { method: 'POST' })
  return response.ok
}
