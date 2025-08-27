import redis from '@/connections/redis'

import { getPlatform } from './Platform'

export type Version = {
  content: string
}

export async function getVersions(platformId: string) {
  'use server'

  const platform = await getPlatform(platformId)
  return platform?.versions ?? []
}

export async function getVersion(platform: string, id: string) {
  'use server'

  const [version] = await redis.zrevrangebyscore(`platforms:${platform}:schemas:${id}`, '+inf', '-inf', 'LIMIT', 0, 1)
  return version ? (JSON.parse(version) as Version) : null
}

export async function saveVersion(platform: string, id: string, data: Record<string, unknown>) {
  'use server'

  await redis.zadd(`${platform}:versions:${id}`, Date.now(), JSON.stringify(data))
}
