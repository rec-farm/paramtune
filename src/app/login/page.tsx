'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn, signOut, useSession } from '@/lib/auth-client'

function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-grid-subtle">
      <div className="border border-primary/30 bg-black/90 p-8 text-center">
        <div className="shimmer h-6 w-32 mx-auto" />
        <p className="text-gray-500 mt-4 font-fragmented text-sm">Loading...</p>
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
          <span className="bg-black px-2 text-gray-500 tracking-widest font-fragmented text-[10px]">
            Development only
          </span>
        </div>
      </div>
      <button
        onClick={handleDevLogin}
        disabled={loading}
        className="btn btn-secondary w-full font-fragmented"
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
      <div className="min-h-screen flex items-center justify-center bg-black bg-grid-subtle relative">
        <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden opacity-20">
          <div className="absolute top-[30%] left-[-5%] w-[40%] circuit-line rotate-12" />
          <div className="absolute top-[60%] right-[-10%] w-[50%] circuit-line -rotate-6" />
        </div>

        <div className="border border-primary/30 bg-black/90 p-8 w-full max-w-md relative z-10">
          <div className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-primary" />
          <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b border-l border-primary" />

          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold tracking-widest text-primary mb-2">
              PARAMTUNE
            </h1>
            <p className="text-gray-500 text-[10px] font-fragmented uppercase tracking-widest">
              Welcome back
            </p>
          </div>

          <div className="space-y-6">
            {/* User info */}
            <div className="text-center py-6 border-y border-primary/20">
              {session.user.image && (
                <Image
                  src={session.user.image}
                  alt="Profile"
                  width={64}
                  height={64}
                  unoptimized
                  className="w-16 h-16 mx-auto mb-4 border-2 border-primary/30"
                />
              )}
              <p className="text-lg font-display font-bold text-foreground tracking-wider">
                {session.user.name}
              </p>
              <p className="text-xs text-gray-500 font-fragmented">
                {session.user.email}
              </p>
            </div>

            <button
              onClick={() => signOut()}
              className="btn btn-secondary w-full font-fragmented"
            >
              Sign out
            </button>

            <a
              href={returnTo}
              className="btn btn-ghost w-full text-center block font-fragmented"
            >
              {returnTo === '/dashboard' ? 'Go to Dashboard' : 'Back to Dashboard'}
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black bg-grid-subtle relative">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden opacity-20">
        <div className="absolute top-[30%] left-[-5%] w-[40%] circuit-line rotate-12" />
        <div className="absolute top-[60%] right-[-10%] w-[50%] circuit-line -rotate-6" />
      </div>

      <div className="border border-primary/30 bg-black/90 p-8 w-full max-w-md relative z-10 animate-in">
        <div className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-primary" />
        <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b border-l border-primary" />

        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold tracking-widest text-primary mb-2">
            PARAMTUNE
          </h1>
          <p className="text-gray-500 text-[10px] font-fragmented uppercase tracking-widest">
            Schema editing, refined
          </p>
        </div>

        <div className="space-y-6">
          <button
            onClick={() => signIn.social({
              provider: 'google',
              callbackURL: returnTo
            })}
            className="w-full bg-primary text-black px-8 py-4 font-display font-bold text-sm tracking-widest hover:translate-x-1 transition-transform flex items-center justify-center gap-3"
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
            SIGN_IN_WITH_GOOGLE
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-primary/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-black px-2 text-gray-500 tracking-widest font-fragmented text-[10px]">
                Secure authentication
              </span>
            </div>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <DevLoginButton returnTo={returnTo} />
          )}

          <p className="text-[10px] text-gray-600 text-center font-fragmented uppercase tracking-wider">
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
