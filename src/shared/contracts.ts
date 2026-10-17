import type { DiffResult } from '@/lib/schemaDiff'

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

export type PlatformKind = 'ios' | 'android' | 'web' | 'service' | 'custom'

export type Platform = {
  kind?: PlatformKind
  name: string
  versions: string[]
  /** Readable through the public API without a token. */
  public?: boolean
}

export type VersionStatus = {
  platform: string
  version: string
  savedAt?: number
  author?: string
  hasContent: boolean
}

export type Overview = {
  platforms: Platform[]
  statuses: VersionStatus[]
  failed: number
}

export type SchemaDetail = {
  schema: Schema | Record<string, never>
  history: SchemaHistoryEntry[]
  contentHash: string
}

export type CompareResult = {
  diffResult: DiffResult
  schemaAContent: Record<string, unknown>
  schemaBContent: Record<string, unknown>
}

export type ApiToken = {
  id: string
  name: string
  /** Readable platforms; null grants every platform. */
  platforms: string[] | null
  hint: string
  createdAt: number
  createdBy: { id: string, name?: string }
  lastUsedAt?: number
}

export type CreatedApiToken = {
  token: string
  record: ApiToken
}
