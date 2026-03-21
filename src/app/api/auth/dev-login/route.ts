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

  // Ensure user exists, then sign in
  try {
    await auth.api.signUpEmail({
      body: {
        email: DEV_USER.email,
        password: DEV_USER.password,
        name: DEV_USER.name,
      },
    })
  } catch {
    // User already exists — that's fine
  }

  const session = await auth.api.signInEmail({
    body: { email: DEV_USER.email, password: DEV_USER.password },
  })

  return NextResponse.json(session)
}
