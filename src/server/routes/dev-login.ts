import { auth } from '@/lib/auth'



const DEV_USER = {
  email: process.env.DEV_USER_EMAIL,
  password: process.env.DEV_USER_PASSWORD,
  name: process.env.DEV_USER_NAME || 'Dev User',
}

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return Response.json({ error: 'Not available' }, { status: 404 })
  }

  if (!DEV_USER.email || !DEV_USER.password) {
    return Response.json(
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

  return auth.api.signInEmail({
    asResponse: true,
    body: { email: DEV_USER.email, password: DEV_USER.password },
  })

}
