import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const DEV_USER = {
  email: 'dev@paramtune.local',
  password: 'dev-password-123',
  name: 'Dev User',
}

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  // Try to sign in first
  const signInRes = await auth.api.signInEmail({
    body: { email: DEV_USER.email, password: DEV_USER.password },
  })

  if (signInRes) {
    return signInRes
  }

  // If sign-in fails, create the account then sign in
  await auth.api.signUpEmail({
    body: {
      email: DEV_USER.email,
      password: DEV_USER.password,
      name: DEV_USER.name,
    },
  })

  return auth.api.signInEmail({
    body: { email: DEV_USER.email, password: DEV_USER.password },
  })
}
