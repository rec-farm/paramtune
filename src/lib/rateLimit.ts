type RateLimitEntry = {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically. Unref the timer so importing this
// module doesn't by itself keep the process alive (e.g. in scripts or tests
// that expect to exit once their own work is done); the Edge runtime this
// also runs under has no Node timer handle, hence the guard.
const cleanupInterval = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key)
    }
  }
}, 60_000)
if (typeof cleanupInterval.unref === 'function') {
  cleanupInterval.unref()
}

type RateLimitConfig = {
  maxRequests: number
  windowMs: number
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 10 per 15 min
  api: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 per minute
}

export function checkRateLimit(
  ip: string,
  type: 'auth' | 'api'
): { allowed: boolean; retryAfter?: number } {
  const config = RATE_LIMITS[type]
  const key = `${type}:${ip}`
  const now = Date.now()

  const entry = store.get(key)
  if (!entry || now > entry.resetTime) {
    store.set(key, { count: 1, resetTime: now + config.windowMs })
    return { allowed: true }
  }

  entry.count++
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return { allowed: false, retryAfter }
  }

  return { allowed: true }
}
