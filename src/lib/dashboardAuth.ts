import { auth } from '@/lib/auth'

/** Validate the session at each dashboard service boundary, including mutations. */
export async function requireDashboardSession(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session) {
    throw new Error('Unauthorized')
  }
  return session
}
