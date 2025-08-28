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
    platforms.push(
      ...keys
        .map((key) => key.split(':')[1])
        .filter((name) => name && name.trim() !== '')
    )
  } while (cursor !== '0')

  const results = await Promise.all(platforms.map(getPlatform))
  return results.filter((p): p is Platform => Boolean(p))
}

export async function getPlatform(id: string): Promise<Platform | null> {
  'use server'

  const [platform] = await redis.zrevrangebyscore(
    `platforms:${id}`,
    '+inf',
    '-inf',
    'LIMIT',
    0,
    1
  )

  return platform ? (JSON.parse(platform) as Platform) : null
}

export async function savePlatform(id: string, data: Record<string, unknown>) {
  'use server'

  if (!id || id.trim() === '') {
    throw new Error('Platform ID cannot be empty')
  }

  await redis.zadd(`platforms:${id}`, Date.now(), JSON.stringify(data))
}
