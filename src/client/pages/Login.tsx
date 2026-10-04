import { Suspense, useState } from 'react'
import { useSearchParams, useLoaderData } from 'react-router'
import type { LoginProviders } from '@/shared/auth'
import { Loader2 } from 'lucide-react'
import { signIn, signOut, useSession } from '@/lib/auth-client'
import Logo from '@/components/Logo'
import { OIDC_PROVIDER_ID, displayEmail } from '@/shared/auth'

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

  async function handleDevLogin() {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/dev-login', { method: 'POST' })
      if (res.ok) {
        window.location.assign(returnTo)
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

type LoginProps = LoginProviders

// Better Auth sends failed sign-ins back here with ?error=<code>
const SIGN_IN_ERRORS: Record<string, string> = {
  access_denied: 'Sign-in was cancelled or this account isn’t allowed to use Paramtune.',
  state_mismatch: 'That sign-in took too long or was started in another tab. Try again.',
  please_restart_the_process: 'That sign-in took too long or was started in another tab. Try again.',
}

function signInErrorMessage(code: string | null) {
  if (!code) return null
  return SIGN_IN_ERRORS[code] ?? 'Sign-in didn’t complete. Try again.'
}

type Provider = typeof OIDC_PROVIDER_ID | 'google'

function LoginContent({ oidc, google, development }: LoginProps) {
  const [searchParams] = useSearchParams()
  const requestedPath = searchParams.get('returnTo') || '/dashboard'
  const returnTo = requestedPath.startsWith('/') && !requestedPath.startsWith('//') && !requestedPath.includes('\\') ? requestedPath : '/dashboard'
  const { data: session, isPending } = useSession()
  const [pending, setPending] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(() =>
    signInErrorMessage(searchParams.get('error')),
  )

  // On success the browser leaves for the provider, so only failures come back
  async function startSignIn(provider: Provider) {
    setPending(provider)
    setError(null)
    try {
      const result = await signIn.social({
        provider,
        callbackURL: returnTo,
        errorCallbackURL: '/login',
      })
      if (result.error) {
        setError(result.error.message || 'Sign-in didn’t start. Try again.')
        setPending(null)
      }
    } catch {
      setError('Sign-in didn’t start. Check your connection and try again.')
      setPending(null)
    }
  }

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
              <img
                src={session.user.image}
                alt=""
                width={48}
                height={48}
                className="w-12 h-12 rounded-xs border border-border-strong"
              />
            )}
            <div className="min-w-0">
              <p className="text-lg font-semibold text-foreground truncate">
                {session.user.name}
              </p>
              {displayEmail(session.user.email) && (
                <p className="font-mono text-sm text-muted-foreground truncate">
                  {displayEmail(session.user.email)}
                </p>
              )}
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
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          {oidc && (
            <button
              type="button"
              onClick={() => startSignIn(OIDC_PROVIDER_ID)}
              disabled={pending !== null}
              aria-busy={pending === OIDC_PROVIDER_ID}
              className="pt-btn pt-btn-primary w-full h-11"
            >
              {pending === OIDC_PROVIDER_ID && (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />
              )}
              Sign in with {oidc.label}
            </button>
          )}

          {google && (
            <button
              type="button"
              onClick={() => startSignIn('google')}
              disabled={pending !== null}
              aria-busy={pending === 'google'}
              className={oidc ? 'pt-btn pt-btn-secondary w-full h-11' : 'pt-btn pt-btn-primary w-full h-11'}
            >
              {pending === 'google' && (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />
              )}
              Sign in with Google
            </button>
          )}

          {!oidc && !google && !development && (
            <p className="text-sm text-muted-foreground">
              No sign-in method is set up. Set OIDC_ISSUER and OIDC_CLIENT_ID, or the Google
              credentials, and restart Paramtune.
            </p>
          )}

          {development && (
            <DevLoginButton returnTo={returnTo} />
          )}

          <p className="text-sm text-muted-foreground">
            We use your {oidc || !google ? 'account' : 'Google account'} only to sign you
            in. Your schemas stay on this server and are never shared.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  const props = useLoaderData() as LoginProviders
  return (
    <Suspense fallback={<LoadingState />}>
      <LoginContent {...props} />
    </Suspense>
  )
}
