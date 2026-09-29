'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { signIn, signOut, useSession } from '@/lib/auth-client'

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div
        className="pt-card w-full max-w-md p-8 space-y-4"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="pt-skeleton h-8 w-40" />
        <div className="pt-skeleton h-4 w-56" />
        <div className="pt-skeleton h-10 w-full" />
        <span className="sr-only">Loading…</span>
      </div>
    </div>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="pt-label text-meta">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

function DevLoginButton({ returnTo }: { returnTo: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDevLogin() {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/dev-login', { method: 'POST' })
      if (res.ok) {
        router.push(returnTo)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Divider label="Development only" />
      <button
        type="button"
        onClick={handleDevLogin}
        disabled={loading}
        aria-busy={loading}
        className="pt-btn pt-btn-secondary w-full"
      >
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />
        )}
        {loading ? 'Signing in…' : 'Dev login (skip OAuth)'}
      </button>
    </>
  )
}

function LoginContent() {
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/dashboard'
  const { data: session, isPending } = useSession()

  if (isPending) {
    return <LoadingState />
  }

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="pt-card w-full max-w-md p-8 space-y-8">
          <div className="space-y-2">
            <h1 className="pt-display text-xl">Paramtune</h1>
            <p className="text-sm text-muted-foreground">Welcome back.</p>
          </div>

          <div className="flex items-center gap-4 py-6 border-y border-border">
            {session.user.image && (
              <Image
                src={session.user.image}
                alt=""
                width={48}
                height={48}
                unoptimized
                className="w-12 h-12 border border-border-strong"
              />
            )}
            <div className="min-w-0">
              <p className="font-bold text-foreground truncate">
                {session.user.name}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {session.user.email}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <a href={returnTo} className="pt-btn pt-btn-primary w-full">
              {returnTo === '/dashboard' ? 'Go to dashboard' : 'Back to dashboard'}
            </a>
            <button
              type="button"
              onClick={() => signOut()}
              className="pt-btn pt-btn-ghost w-full"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="pt-card w-full max-w-md p-8 space-y-8 animate-in">
        <div className="space-y-2">
          <h1 className="pt-display text-xl">Paramtune</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your schemas.
          </p>
        </div>

        <div className="space-y-6">
          <button
            type="button"
            onClick={() => signIn.social({
              provider: 'google',
              callbackURL: returnTo
            })}
            className="pt-btn pt-btn-primary w-full h-12"
          >
            Sign in with Google
          </button>

          {process.env.NODE_ENV === 'development' && (
            <DevLoginButton returnTo={returnTo} />
          )}

          <p className="text-sm text-muted-foreground">
            Sign in with your Google account to access your schemas and
            settings. Your data is stored on this server and never shared.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <LoginContent />
    </Suspense>
  )
}
