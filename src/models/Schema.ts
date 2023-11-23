import semver from 'semver'

import redis from '@/connections/redis'
import { getPlatforms } from './Platform'

export type Schema = {
  content: Record<string, unknown>
  dependencies: string[]
  output: Record<string, unknown>
}

const getKey = (platform: string, version: string) =>
  `schemas:${platform}:${version}`

function findDependenciesInContent(content: Record<string, unknown>) {
  const dependencies = Object.entries(content)
    .flatMap(([key, value]) => {
      if (key === '@extends' && typeof value === 'string') {
        return value
      }

      if (typeof value === 'object' && value !== null) {
        return findDependenciesInContent(value as Record<string, unknown>)
      }

      return null
    })
    .filter((dependency) => typeof dependency === 'string') as string[]

  return Array.from(new Set(dependencies))
}

async function resolveDependencies(dependencies: string[]) {
  const platforms = await getPlatforms()

  const getPlatform = (platform: string) =>
    platforms.find((p) => p.name === platform)

  const getVersion = (
    platform: ReturnType<typeof getPlatform>,
    version: string,
  ) => platform?.versions.find((v) => semver.satisfies(version, v))

  dependencies.map((dependency) => {
    const [rawPlatform, rawVersion = 'latest'] = dependency.split('/') as [
      string,
      string | undefined,
    ]

    const platform = getPlatform(rawPlatform)
    const version = rawVersion === 'latest' ? platform?.versions[0] : rawVersion

    if (!platform) {
      throw new Error(`Missing platform (${platform})`)
    }

    const existingVersion = getVersion(platform, version || '')

    return { platform: rawPlatform, version: existingVersion }
  })
}

export async function getSchema(
  platform: string,
  version: string,
): Promise<Schema> {
  'use server'

  const [schema] = await redis.zrevrangebyscore(
    getKey(platform, version),
    '+inf',
    '-inf',
    'LIMIT',
    0,
    1,
  )
  return schema ? JSON.parse(schema) : {}
}

export async function saveSchema(
  platform: string,
  version: string,
  content: Record<string, unknown>,
) {
  'use server'

  const dependencies = findDependenciesInContent(content)
  const dependenciesR = await resolveDependencies(dependencies)

  console.log(dependenciesR)

  const output = { testing: true }

  await redis.zadd(
    getKey(platform, version),
    Date.now(),
    JSON.stringify({ dependencies, content, output }),
  )
}

export async function previewJsonOutput(content: Record<string, unknown>) {
  'use server'

  const dependencies = findDependenciesInContent(content)
  resolveDependencies(dependencies)

  return ''
}
