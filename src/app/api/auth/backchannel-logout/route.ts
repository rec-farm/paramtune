import { NextResponse } from 'next/server'
import { auth, oidcSettings } from '@/lib/auth'
import { OIDC_PROVIDER_ID } from '@/lib/oidc'
import { LogoutTokenError, verifyLogoutTokenWithDiscovery } from '@/lib/oidcLogoutToken'

const noStore = { 'Cache-Control': 'no-store' }

// OpenID Connect Back-Channel Logout: the provider POSTs a signed logout_token
// when someone signs out there, and every Paramtune session of that person ends.
export async function POST(request: Request) {
  if (!oidcSettings) {
    return NextResponse.json({ error: 'not_found' }, { status: 404, headers: noStore })
  }

  let token: string | null = null
  if (request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')) {
    token = new URLSearchParams(await request.text()).get('logout_token')
  }
  if (!token) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'logout_token is required' },
      { status: 400, headers: noStore },
    )
  }

  let subject: string
  try {
    ;({ sub: subject } = await verifyLogoutTokenWithDiscovery(token, oidcSettings))
  } catch (error) {
    if (!(error instanceof LogoutTokenError)) {
      console.error('Back-channel logout verification failed', error)
    }
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Invalid logout_token' },
      { status: 400, headers: noStore },
    )
  }

  // Sessions don't record the provider's sid, so end every session of the user
  const ctx = await auth.$context
  const account = await ctx.internalAdapter.findAccountByKey({
    providerId: OIDC_PROVIDER_ID,
    accountId: subject,
  })
  if (account) {
    await ctx.internalAdapter.deleteUserSessions(account.userId)
  }

  return new NextResponse(null, { status: 200, headers: noStore })
}
