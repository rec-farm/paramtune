import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'



const DEV_USER = {
  email: process.env.DEV_USER_EMAIL,
  password: process.env.DEV_USER_PASSWORD,
  name: process.env.DEV_USER_NAME || 'Dev User',
}

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 })
  }

  if (!DEV_USER.email || !DEV_USER.password) {
    return NextResponse.json(
      { error: 'Development credentials not configured in environment' },
      { status: 500 }
    )
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
