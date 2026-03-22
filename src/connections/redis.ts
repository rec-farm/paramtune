import Redis from 'ioredis'

type RedisClient = InstanceType<typeof Redis>

function createRedisClient(): RedisClient {
  const url = process.env.REDIS_URL

  if (url) {
    return new Redis(url)
  }

  const host = process.env.REDIS_HOST || '127.0.0.1'
  const port = Number(process.env.REDIS_PORT || 6379)
  const password = process.env.REDIS_PASSWORD
  const db = Number(process.env.REDIS_DB || 2)

  return new Redis({
    host,
    port,
    password,
    db,
  })
}

declare global {
   
  var __paramtune_redis__: RedisClient | undefined
}

const redis: RedisClient = global.__paramtune_redis__ ?? createRedisClient()
if (process.env.NODE_ENV !== 'production') {
  global.__paramtune_redis__ = redis
}

export default redis
