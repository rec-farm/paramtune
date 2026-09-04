import { auth } from '@/lib/auth'

/**
 * Guards a dashboard Server Action with a fresh session check.
 *
 * Server Actions are invoked directly by their encrypted reference, not by
 * re-running the page/layout tree that created them — so the dashboard
 * layout's `auth.api.getSession` redirect (see src/app/dashboard/layout.tsx)
 * only gates the initial page render, not a later invocation of an action
 * bound to that render. Every write path under app/api already re-checks the
 * session per-request via apiHandler.ts's requireSession; dashboard actions
 * need the same treatment since they perform the same Redis writes.
 */
export async function requireDashboardSession(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}
