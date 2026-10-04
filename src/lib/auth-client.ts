import { useEffect, useState } from 'react'

interface Session {
  user: { id: string, name: string, email: string, image?: string | null, role?: string }
  session: { id: string, expiresAt: string }
}

export function useSession() {
  const [data, setData] = useState<Session | null>(null)
  const [isPending, setPending] = useState(true)
  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/auth/get-session', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Session lookup failed')
        setData(await response.json() as Session | null)
      })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setPending(false) })
    return () => controller.abort()
  }, [])
  return { data, isPending }
}

export const signIn = {
  async social(input: { provider: string, callbackURL: string }) {
    const response = await fetch('/api/auth/sign-in/social', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input),
    })
    const result = await response.json() as { url?: string, error?: string }
    if (!response.ok || !result.url) return { error: { message: result.error || 'Sign-in failed' } }
    window.location.assign(result.url)
    return { error: null }
  },
}

export async function signOut() {
  const response = await fetch('/api/auth/sign-out', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  if (!response.ok) throw new Error('Sign-out failed')
  const result = await response.json() as { url?: string }
  window.location.assign(result.url || '/login')
}
