'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn, signOut, useSession } from '@/lib/auth-client'

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-radial">
      <div className="glass-card p-8 text-center">
        <div className="shimmer h-6 w-32 mx-auto rounded" />
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
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
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-primary/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-black/50 px-2 text-muted-foreground tracking-wider">
            Development only
          </span>
        </div>
      </div>
      <button
        onClick={handleDevLogin}
        disabled={loading}
        className="btn btn-secondary w-full"
      >
        {loading ? 'Signing in...' : 'Dev Login (skip OAuth)'}
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-radial relative">
        {/* Background noise overlay */}
        <div className="absolute inset-0 bg-noise pointer-events-none" />

        <div className="glass-card corner-accent p-8 w-full max-w-md relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-wider gradient-text mb-2">
              PARAMTUNE
            </h1>
            <p className="text-muted-foreground text-sm tracking-wide">
              Welcome back
            </p>
          </div>

          <div className="space-y-6">
            {/* User info */}
            <div className="text-center py-6 border-y border-primary/20">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt="Profile"
                  className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-primary/30"
                />
              )}
              <p className="text-lg font-medium text-foreground">
                {session.user.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {session.user.email}
              </p>
            </div>

            {/* Sign out button */}
            <button
              onClick={() => signOut()}
              className="btn btn-secondary w-full"
            >
              Sign out
            </button>

            {/* Back to app link */}
            <a
              href={returnTo}
              className="btn btn-ghost w-full text-center block"
            >
              {returnTo === '/dashboard' ? 'Go to Dashboard' : 'Back to Dashboard'}
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-radial relative">
      {/* Background noise overlay */}
      <div className="absolute inset-0 bg-noise pointer-events-none" />

      <div className="glass-card corner-accent p-8 w-full max-w-md relative z-10 animate-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-wider gradient-text mb-2">
            PARAMTUNE
          </h1>
          <p className="text-muted-foreground text-sm tracking-wide">
            Schema editing, refined
          </p>
        </div>

        <div className="space-y-6">
          {/* Sign in button */}
          <button
            onClick={() => signIn.social({
              provider: 'google',
              callbackURL: returnTo
            })}
            className="btn btn-primary w-full flex items-center justify-center gap-3"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-primary/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black/50 px-2 text-muted-foreground tracking-wider">
                Secure authentication
              </span>
            </div>
          </div>

          {/* Dev login - only in development */}
          {process.env.NODE_ENV === 'development' && (
            <DevLoginButton returnTo={returnTo} />
          )}

          {/* Info text */}
          <p className="text-xs text-muted-foreground text-center">
            Sign in with your Google account to access your schemas and settings.
            Your data is stored securely and never shared.
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
