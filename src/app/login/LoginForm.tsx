'use client'

import { Suspense, useState } from 'react'
import Image from 'next/image'
import { useSearchParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { signIn, signOut, useSession } from '@/lib/auth-client'
import Logo from '@/components/Logo'
import { OIDC_PROVIDER_ID } from '@/lib/oidc'

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

export interface OidcSignIn {
  label: string
}

function LoginContent({ oidc }: { oidc: OidcSignIn | null }) {
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
          <Logo height={20} />
          <div>
            <p className="pt-eyebrow">Signed in</p>
            <h1 className="pt-title-2 mt-2">
              Welcome back<span className="pt-period">.</span>
            </h1>
          </div>

          <div className="flex items-center gap-4 py-6 border-y border-border">
            {session.user.image && (
              <Image
                src={session.user.image}
                alt=""
                width={48}
                height={48}
                unoptimized
                className="w-12 h-12 rounded-xs border border-border-strong"
              />
            )}
            <div className="min-w-0">
              <p className="text-lg font-semibold text-foreground truncate">
                {session.user.name}
              </p>
              <p className="font-mono text-sm text-muted-foreground truncate">
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
        <Logo height={20} />
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG illustration */}
        <img
          src="/brand/header-paramtune-dark.svg"
          alt=""
          width={520}
          height={320}
          className="w-full h-auto"
        />
        <div>
          <p className="pt-eyebrow">Your configs are waiting</p>
          <h1 className="pt-title-2 mt-2">
            Sign in<span className="pt-period">.</span>
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Pick up right where you left off.
          </p>
        </div>

        <div className="space-y-6">
          {oidc && (
            <button
              type="button"
              onClick={() => signIn.social({
                provider: OIDC_PROVIDER_ID,
                callbackURL: returnTo
              })}
              className="pt-btn pt-btn-primary w-full h-11"
            >
              Sign in with {oidc.label}
            </button>
          )}

          <button
            type="button"
            onClick={() => signIn.social({
              provider: 'google',
              callbackURL: returnTo
            })}
            className={oidc ? 'pt-btn pt-btn-secondary w-full h-11' : 'pt-btn pt-btn-primary w-full h-11'}
          >
            Sign in with Google
          </button>

          {process.env.NODE_ENV === 'development' && (
            <DevLoginButton returnTo={returnTo} />
          )}

          <p className="text-sm text-muted-foreground">
            We use your {oidc ? 'account' : 'Google account'} only to sign you
            in. Your schemas stay on this server and are never shared.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginForm({ oidc }: { oidc: OidcSignIn | null }) {
  return (
    <Suspense fallback={<LoadingState />}>
      <LoginContent oidc={oidc} />
    </Suspense>
  )
}
