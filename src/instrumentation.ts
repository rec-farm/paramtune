// Runs once per server start, before the first request is handled: wait for
// the auth database migrations so no request can hit a missing table.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { authMigrations } = await import('@/lib/auth')
    await authMigrations
  }
}
