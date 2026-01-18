import semver from 'semver'

import redis from '@/connections/redis'
import { getPlatforms } from './Platform'
import type { Platform } from './Platform'

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

type ResolvedDependency = { platform: string; version: string }

async function resolveDependencies(
  dependencies: string[]
): Promise<ResolvedDependency[]> {
  const platforms = await getPlatforms()

  function findPlatform(platformName: string): Platform | undefined {
    return platforms.find((p) => p.name === platformName)
  }

  function resolveVersion(
    platform: Platform,
    requested: string
  ): string | null {
    if (requested === 'latest') {
      const sorted = [...(platform.versions || [])].sort(semver.rcompare)
      return sorted[0] ?? null
    }

    const hasRangeOperator = /[~^*><=|]/.test(requested)
    if (hasRangeOperator) {
      const max = semver.maxSatisfying(platform.versions || [], requested)
      return max ?? null
    }

    return (platform.versions || []).includes(requested) ? requested : null
  }

  const resolved: ResolvedDependency[] = []

  for (const dependency of dependencies) {
    const [rawPlatform, rawVersion = 'latest'] = dependency.split('/') as [
      string,
      string | undefined
    ]

    const platform = findPlatform(rawPlatform)
    if (!platform) {
      throw new Error(`Missing platform (${rawPlatform})`)
    }

    const chosenVersion = resolveVersion(platform, rawVersion || 'latest')
    if (!chosenVersion) {
      throw new Error(
        `No version found for ${rawPlatform} satisfying "${rawVersion}"`
      )
    }

    resolved.push({ platform: rawPlatform, version: chosenVersion })
  }

  return resolved
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    if (key === '@extends') continue
    const existing = result[key]
    if (isPlainObject(existing) && isPlainObject(value)) {
      result[key] = deepMerge(existing, value)
    } else {
      result[key] = value
    }
  }
  return result
}

async function getLatestSchemaContent(
  platform: string,
  version: string
): Promise<Record<string, unknown>> {
  const base = await getSchema(platform, version)
  return (base as Schema)?.content ?? {}
}

async function processNodeWithExtends(
  node: unknown,
  visited: Set<string>
): Promise<unknown> {
  if (Array.isArray(node)) {
    return Promise.all(
      node.map((item) => processNodeWithExtends(item, visited))
    )
  }
  if (!isPlainObject(node)) {
    return node
  }

  let result: Record<string, unknown> = {}

  if (typeof node['@extends'] === 'string') {
    const ref = node['@extends'] as string
    const [platform, versionRange = 'latest'] = ref.split('/') as [
      string,
      string | undefined
    ]

    const key = `${platform}/${versionRange}`
    if (visited.has(key)) {
      throw new Error(`Circular dependency detected at ${key}`)
    }
    visited.add(key)

    const deps = await resolveDependencies([ref])
    const concrete = deps[0]
    const baseContent = await getLatestSchemaContent(
      concrete.platform,
      concrete.version
    )
    const processedBase = (await processNodeWithExtends(
      baseContent,
      visited
    )) as Record<string, unknown>

    const override = { ...node }
    delete override['@extends']
    const processedOverride = (await processNodeWithExtends(
      override,
      visited
    )) as Record<string, unknown>

    result = deepMerge(processedBase, processedOverride)
  } else {
    const entries = await Promise.all(
      Object.entries(node).map(async ([k, v]) => [
        k,
        await processNodeWithExtends(v, visited),
      ])
    )
    result = Object.fromEntries(entries)
  }

  return result
}

export async function getSchema(
  platform: string,
  version: string
): Promise<Schema | Record<string, never>> {
  'use server'

  const [schema] = await redis.zrevrangebyscore(
    getKey(platform, version),
    '+inf',
    '-inf',
    'LIMIT',
    0,
    1
  )
  return schema ? (JSON.parse(schema) as Schema) : {}
}

export async function saveSchema(
  platform: string,
  version: string,
  content: Record<string, unknown>
) {
  'use server'

  if (!isPlainObject(content)) {
    throw new Error('Schema content must be a JSON object')
  }

  const dependencies = findDependenciesInContent(content)
  await resolveDependencies(dependencies)

  const output = (await processNodeWithExtends(content, new Set())) as Record<
    string,
    unknown
  >

  await redis.zadd(
    getKey(platform, version),
    Date.now(),
    JSON.stringify({ dependencies, content, output })
  )

  const resolved = await resolveDependencies(dependencies)
  const selfId = `${platform}/${version}`
  for (const dep of resolved) {
    await redis.sadd(
      `schemas:dependents:${dep.platform}:${dep.version}`,
      selfId
    )
  }

  await cascadeDependents(platform, version, new Set([selfId]))
}

export async function previewJsonOutput(content: Record<string, unknown>) {
  'use server'

  const dependencies = findDependenciesInContent(content)
  await resolveDependencies(dependencies)

  const output = await processNodeWithExtends(content, new Set())
  return JSON.stringify(output)
}

export type SchemaValidationResult = {
  valid: boolean
  errors: string[]
}

export async function validateSchemaContent(
  content: Record<string, unknown>
): Promise<SchemaValidationResult> {
  'use server'

  const errors: string[] = []

  // Check if content is a valid object
  if (!isPlainObject(content)) {
    return { valid: false, errors: ['Schema content must be a JSON object'] }
  }

  // Extract and validate @extends dependencies
  const dependencies = findDependenciesInContent(content)

  if (dependencies.length === 0) {
    return { valid: true, errors: [] }
  }

  // Try to resolve each dependency and collect errors
  for (const dependency of dependencies) {
    try {
      await resolveDependencies([dependency])
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : `Invalid dependency: ${dependency}`
      errors.push(errorMessage)
    }
  }

  return { valid: errors.length === 0, errors }
}

export type SchemaHistoryEntry = {
  timestamp: number
  content: Record<string, unknown>
  dependencies: string[]
  output: Record<string, unknown>
}

export async function getSchemaHistoryWithTimestamps(
  platform: string,
  version: string,
  limit: number = 50
): Promise<Array<SchemaHistoryEntry & { timestamp: number }>> {
  'use server'

  const schemasWithScores = await redis.zrevrangebyscore(
    getKey(platform, version),
    '+inf',
    '-inf',
    'WITHSCORES',
    'LIMIT',
    0,
    limit
  )

  const result: Array<SchemaHistoryEntry & { timestamp: number }> = []

  for (let i = 0; i < schemasWithScores.length; i += 2) {
    const schema = schemasWithScores[i]
    const timestamp = parseInt(schemasWithScores[i + 1])
    const parsed = JSON.parse(schema) as Schema

    result.push({
      timestamp,
      content: parsed.content,
      dependencies: parsed.dependencies,
      output: parsed.output,
    })
  }

  return result
}

async function cascadeDependents(
  platform: string,
  version: string,
  visited: Set<string>
) {
  const dependentsKey = `schemas:dependents:${platform}:${version}`
  const dependents = await redis.smembers(dependentsKey)
  for (const dep of dependents) {
    if (visited.has(dep)) continue
    visited.add(dep)
    const [depPlatform, depVersion] = dep.split('/')
    const latest = (await getSchema(depPlatform, depVersion)) as Schema
    if (latest && latest.content) {
      await saveSchema(depPlatform, depVersion, latest.content)
      await cascadeDependents(depPlatform, depVersion, visited)
    }
  }
}

// Cross-schema comparison (for Phase 7 visual diff UI)

import { diffSchemas, type DiffResult } from '@/lib/schemaDiff'

/**
 * Compare schemas across different platforms/versions
 * Returns a diff result showing changes between the two schemas
 */
export async function compareSchemas(
  platformA: string,
  versionA: string,
  platformB: string,
  versionB: string
): Promise<DiffResult> {
  'use server'

  const [schemaA, schemaB] = await Promise.all([
    getSchema(platformA, versionA),
    getSchema(platformB, versionB),
  ])

  // Handle empty schemas
  const contentA = (schemaA as Schema)?.content ?? {}
  const contentB = (schemaB as Schema)?.content ?? {}

  return diffSchemas({ content: contentA } as Schema, { content: contentB } as Schema)
}
