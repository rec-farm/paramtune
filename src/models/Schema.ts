import { Effect, Data } from 'effect'
import semver from 'semver'

import redis from '@/connections/redis'
import {
  redisCall,
  getLatestFromSortedSet,
  appendToSortedSet,
} from '@/lib/effectRedis'
import {
  getCachedPlatforms,
  clearPlatformsCache,
  MissingPlatformError,
} from './Platform'
import type { Platform } from './Platform'
import { diffSchemas, type DiffResult } from '@/lib/schemaDiff'
import { sortVersionsDescending } from '@/lib/versionUtils'

export { clearPlatformsCache }

// ── Error types ──────────────────────────────────────────────────────────────

export class VersionNotFoundError extends Data.TaggedError(
  'VersionNotFoundError'
)<{
  readonly platform: string
  readonly requested: string
}> {
  get message() {
    return `No version found for ${this.platform} satisfying "${this.requested}"`
  }
}

export class CircularDependencyError extends Data.TaggedError(
  'CircularDependencyError'
)<{
  readonly ref: string
}> {
  get message() {
    return `Circular dependency detected at ${this.ref}`
  }
}

export class InvalidContentError extends Data.TaggedError(
  'InvalidContentError'
)<{}> {
  get message() {
    return 'Schema content must be a JSON object'
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

export type Schema = {
  content: Record<string, unknown>
  dependencies: string[]
  output: Record<string, unknown>
  author?: Author
}

export type Author = {
  id: string
  name: string
  image?: string
}

export type SchemaValidationResult = {
  valid: boolean
  errors: string[]
}

export type SchemaHistoryEntry = {
  timestamp: number
  content: Record<string, unknown>
  dependencies: string[]
  output: Record<string, unknown>
  author?: Author
}

type ResolvedDependency = { platform: string; version: string }

export type SchemaError =
  | MissingPlatformError
  | VersionNotFoundError
  | CircularDependencyError
  | InvalidContentError

// ── Pure helpers ─────────────────────────────────────────────────────────────

export const getKey = (platform: string, version: string) =>
  `schemas:${platform}:${version}`

// getSchemaHistoryWithTimestamps defaults to reading the newest 50 entries,
// so this cap only needs enough headroom above that for callers passing a
// larger explicit limit - it is not a "how much history to keep" tuning knob.
const MAX_SCHEMA_HISTORY_ENTRIES = 200

function findDependenciesInContent(
  content: Record<string, unknown>
): string[] {
  const dependencies = Object.entries(content)
    .flatMap(([key, value]) => {
      if (key === '@extends' && typeof value === 'string') return value
      if (typeof value === 'object' && value !== null)
        return findDependenciesInContent(value as Record<string, unknown>)
      return null
    })
    .filter((dependency) => typeof dependency === 'string') as string[]
  return Array.from(new Set(dependencies))
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

// ── Effect-based internals ───────────────────────────────────────────────────

const resolveDependenciesEffect = (
  dependencies: string[],
  platforms?: Platform[]
): Effect.Effect<
  ResolvedDependency[],
  MissingPlatformError | VersionNotFoundError
> =>
  Effect.gen(function* () {
    const resolvedPlatforms =
      platforms ?? (yield* Effect.promise(() => getCachedPlatforms()))

    function findPlatform(name: string): Platform | undefined {
      return resolvedPlatforms.find((p) => p.name === name)
    }

    function resolveVersion(
      platform: Platform,
      requested: string
    ): string | null {
      if (requested === 'latest') {
        const sorted = sortVersionsDescending(platform.versions || [])
        return sorted[0] ?? null
      }
      if (/[~^*><=|]/.test(requested)) {
        return semver.maxSatisfying(platform.versions || [], requested) ?? null
      }
      return (platform.versions || []).includes(requested) ? requested : null
    }

    const resolved: ResolvedDependency[] = []

    for (const dependency of dependencies) {
      const [rawPlatform, rawVersion = 'latest'] = dependency.split('/') as [
        string,
        string | undefined,
      ]

      const platform = findPlatform(rawPlatform)
      if (!platform) {
        return yield* new MissingPlatformError({ platform: rawPlatform })
      }

      const version = rawVersion || 'latest'
      const chosenVersion = resolveVersion(platform, version)
      if (!chosenVersion) {
        return yield* new VersionNotFoundError({
          platform: rawPlatform,
          requested: version,
        })
      }

      resolved.push({ platform: rawPlatform, version: chosenVersion })
    }

    return resolved
  })

const getSchemaEffect = (
  platform: string,
  version: string
): Effect.Effect<Schema | Record<string, never>> =>
  getLatestFromSortedSet<Schema>(getKey(platform, version)).pipe(
    Effect.map((schema) => schema ?? {})
  )

const getLatestSchemaContentEffect = (
  platform: string,
  version: string
): Effect.Effect<Record<string, unknown>> =>
  getSchemaEffect(platform, version).pipe(
    Effect.map((base) => (base as Schema)?.content ?? {})
  )

const processNodeWithExtendsEffect = (
  node: unknown,
  visited: Set<string>,
  platforms?: Platform[]
): Effect.Effect<
  unknown,
  MissingPlatformError | VersionNotFoundError | CircularDependencyError
> =>
  Effect.gen(function* () {
    const resolvedPlatforms =
      platforms ?? (yield* Effect.promise(() => getCachedPlatforms()))

    if (Array.isArray(node)) {
      return yield* Effect.all(
        node.map((item) =>
          processNodeWithExtendsEffect(item, visited, resolvedPlatforms)
        )
      )
    }

    if (!isPlainObject(node)) return node

    if (typeof node['@extends'] === 'string') {
      const ref = node['@extends'] as string
      const [platform, versionRange = 'latest'] = ref.split('/') as [
        string,
        string | undefined,
      ]
      const key = `${platform}/${versionRange}`

      if (visited.has(key)) {
        return yield* new CircularDependencyError({ ref: key })
      }
      // A fresh copy (rather than mutating `visited` in place) keeps cycle
      // detection scoped to this node's own ancestry chain, so sibling
      // fields extending the same base don't get flagged as circular.
      const childVisited = new Set(visited).add(key)

      const deps = yield* resolveDependenciesEffect([ref], resolvedPlatforms)
      const concrete = deps[0]
      const baseContent = yield* getLatestSchemaContentEffect(
        concrete.platform,
        concrete.version
      )
      const processedBase = (yield* processNodeWithExtendsEffect(
        baseContent,
        childVisited,
        resolvedPlatforms
      )) as Record<string, unknown>

      const override = { ...node }
      delete override['@extends']
      const processedOverride = (yield* processNodeWithExtendsEffect(
        override,
        childVisited,
        resolvedPlatforms
      )) as Record<string, unknown>

      return deepMerge(processedBase, processedOverride)
    }

    const entries = yield* Effect.all(
      Object.entries(node).map(([k, v]) =>
        processNodeWithExtendsEffect(v, visited, resolvedPlatforms).pipe(
          Effect.map((processed) => [k, processed] as const)
        )
      )
    )
    return Object.fromEntries(entries)
  })

const saveSchemaEffect = (
  platform: string,
  version: string,
  content: Record<string, unknown>,
  author?: Author,
  platforms?: Platform[]
): Effect.Effect<void, SchemaError> =>
  Effect.gen(function* () {
    if (!isPlainObject(content)) {
      return yield* new InvalidContentError()
    }

    const resolvedPlatforms =
      platforms ?? (yield* Effect.promise(() => getCachedPlatforms()))

    const dependencies = findDependenciesInContent(content)
    const resolved = yield* resolveDependenciesEffect(dependencies, resolvedPlatforms)

    const output = (yield* processNodeWithExtendsEffect(
      content,
      new Set(),
      resolvedPlatforms
    )) as Record<string, unknown>

    yield* appendToSortedSet(
      getKey(platform, version),
      JSON.stringify({ dependencies, content, output, author }),
      MAX_SCHEMA_HISTORY_ENTRIES
    )

    const selfId = `${platform}/${version}`

    for (const dep of resolved) {
      yield* redisCall(() =>
        redis.sadd(
          `schemas:dependents:${dep.platform}:${dep.version}`,
          selfId
        )
      )
    }

    yield* cascadeDependentsEffect(
      platform,
      version,
      new Set([selfId]),
      resolvedPlatforms
    )
  })

const cascadeDependentsEffect = (
  platform: string,
  version: string,
  visited: Set<string>,
  platforms?: Platform[]
): Effect.Effect<void, SchemaError> =>
  Effect.gen(function* () {
    const resolvedPlatforms =
      platforms ?? (yield* Effect.promise(() => getCachedPlatforms()))

    const dependentsKey = `schemas:dependents:${platform}:${version}`
    const dependents = yield* redisCall(() => redis.smembers(dependentsKey))

    for (const dep of dependents) {
      if (visited.has(dep)) continue
      visited.add(dep)
      const [depPlatform, depVersion] = dep.split('/')
      const latest = (yield* getSchemaEffect(
        depPlatform,
        depVersion
      )) as Schema
      if (latest && latest.content) {
        // saveSchemaEffect already cascades to `dep`'s own dependents at its
        // end, so no separate recursive call is needed here - adding one
        // would re-cascade the same subtree a second time, and the
        // duplication compounds at every level of a longer chain.
        yield* saveSchemaEffect(
          depPlatform,
          depVersion,
          latest.content,
          latest.author,
          resolvedPlatforms
        )
      }
    }
  })

// ── Public API ───────────────────────────────────────────────────────────────
// Plain server-side functions, not Server Actions — see the note in
// src/models/Platform.ts for why a `'use server'` directive doesn't belong here.

export async function getSchema(
  platform: string,
  version: string
): Promise<Schema | Record<string, never>> {
  return Effect.runPromise(getSchemaEffect(platform, version))
}

export async function saveSchema(
  platform: string,
  version: string,
  content: Record<string, unknown>,
  author?: Author
) {
  return Effect.runPromise(saveSchemaEffect(platform, version, content, author))
}

export async function previewJsonOutput(content: Record<string, unknown>) {
  return Effect.runPromise(
    Effect.gen(function* () {
      const platforms = yield* Effect.promise(() => getCachedPlatforms())
      const dependencies = findDependenciesInContent(content)
      yield* resolveDependenciesEffect(dependencies, platforms)
      const output = yield* processNodeWithExtendsEffect(
        content,
        new Set(),
        platforms
      )
      return JSON.stringify(output)
    })
  )
}

export async function validateSchemaContent(
  content: Record<string, unknown>
): Promise<SchemaValidationResult> {
  if (!isPlainObject(content)) {
    return { valid: false, errors: ['Schema content must be a JSON object'] }
  }

  const dependencies = findDependenciesInContent(content)
  if (dependencies.length === 0) {
    return { valid: true, errors: [] }
  }

  const platforms = await getCachedPlatforms()
  const results = await Promise.all(
    dependencies.map((dependency) =>
      Effect.runPromise(
        resolveDependenciesEffect([dependency], platforms).pipe(
          Effect.as(null),
          Effect.catchAll((e) => Effect.succeed(e.message))
        )
      )
    )
  )

  const errors = results.filter((error) => error !== null) as string[]

  return { valid: errors.length === 0, errors }
}

export async function getSchemaHistoryWithTimestamps(
  platform: string,
  version: string,
  limit: number = 50
): Promise<Array<SchemaHistoryEntry & { timestamp: number }>> {
  return Effect.runPromise(
    redisCall(() =>
      redis.zrevrangebyscore(
        getKey(platform, version),
        '+inf',
        '-inf',
        'WITHSCORES',
        'LIMIT',
        0,
        limit
      )
    ).pipe(
      Effect.map((schemasWithScores) => {
        const result: Array<SchemaHistoryEntry & { timestamp: number }> = []
        for (let i = 0; i < schemasWithScores.length; i += 2) {
          const schema = schemasWithScores[i]
          const timestamp = parseInt(schemasWithScores[i + 1])
          try {
            const parsed = JSON.parse(schema) as Schema
            result.push({
              timestamp,
              content: parsed.content,
              dependencies: parsed.dependencies,
              output: parsed.output,
              author: parsed.author,
            })
          } catch (parseError) {
            console.error(
              `Failed to parse schema history entry for "${getKey(platform, version)}":`,
              parseError
            )
          }
        }
        return result
      })
    )
  )
}

export type SchemaComparison = {
  diffResult: DiffResult
  schemaAContent: Record<string, unknown>
  schemaBContent: Record<string, unknown>
}

/**
 * Compares two schemas by content and returns both the diff and each
 * schema's raw content, fetching each schema once via getSchemaEffect.
 */
export async function compareSchemasWithContent(
  platformA: string,
  versionA: string,
  platformB: string,
  versionB: string
): Promise<SchemaComparison> {
  return Effect.runPromise(
    Effect.all([
      getSchemaEffect(platformA, versionA),
      getSchemaEffect(platformB, versionB),
    ]).pipe(
      Effect.map(([schemaA, schemaB]) => {
        const schemaAContent = (schemaA as Schema)?.content ?? {}
        const schemaBContent = (schemaB as Schema)?.content ?? {}
        return {
          diffResult: diffSchemas({ content: schemaAContent }, { content: schemaBContent }),
          schemaAContent,
          schemaBContent,
        }
      })
    )
  )
}
