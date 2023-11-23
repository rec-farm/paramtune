import redis from '@/connections/redis'

export type Platform = {
  name: string
  versions: string[]
}


export async function getPlatforms(): Promise<Platform[]> {
  'use server'

  const platforms: string[] = []
  let cursor = '0'

  do {
    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'platforms:*')
    cursor = nextCursor
    platforms.push(...keys.map(key => key.split(':')[1]))
  } while (cursor !== '0')

  return Promise.all(platforms.map(getPlatform))
}

export async function getPlatform(id: string): Promise<Platform> {
  'use server'

  const [platform] = await redis.zrevrangebyscore(`platforms:${id}`, '+inf', '-inf', 'LIMIT', 0, 1)
  return platform ? JSON.parse(platform) : null
}

export async function savePlatform(id: string, data: Record<string, unknown>) {
  'use server'

  await redis.zadd(`platforms:${id}`, Date.now(), JSON.stringify(data))
}
