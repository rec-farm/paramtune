/**
 * Schema Diff Engine
 *
 * Pure TypeScript utility for comparing schema objects.
 * No React dependencies - can be used server-side or client-side.
 */

// Types

export type DiffChangeType = 'added' | 'removed' | 'modified' | 'unchanged'

export interface DiffChange {
  path: string
  type: DiffChangeType
  oldValue?: unknown
  newValue?: unknown
  typeChange?: {
    from: string
    to: string
  }
}

export interface DiffSummary {
  added: number
  removed: number
  modified: number
  unchanged: number
  total: number
}

export interface DiffResult {
  changes: DiffChange[]
  summary: DiffSummary
  /** Grouped changes by type for easy access */
  byType: {
    added: DiffChange[]
    removed: DiffChange[]
    modified: DiffChange[]
    unchanged: DiffChange[]
  }
}

export interface DiffOptions {
  /** Maximum depth to traverse (default: unlimited) */
  maxDepth?: number
  /** Keys to ignore during comparison */
  ignoreKeys?: string[]
  /** Include unchanged fields in result (default: false) */
  includeUnchanged?: boolean
}

// Utility functions

/**
 * Get the JavaScript type of a value as a string
 */
function getValueType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

/**
 * Recursively get all dot-notation paths from an object
 */
export function getNestedKeys(
  obj: Record<string, unknown>,
  prefix = '',
  maxDepth?: number,
  currentDepth = 0
): string[] {
  if (maxDepth !== undefined && currentDepth >= maxDepth) {
    return prefix ? [prefix] : []
  }

  const keys: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    keys.push(fullKey)

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(
        ...getNestedKeys(
          value as Record<string, unknown>,
          fullKey,
          maxDepth,
          currentDepth + 1
        )
      )
    }
  }

  return keys.sort()
}

/**
 * Get a value at a dot-notation path
 */
export function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    return (current as Record<string, unknown>)?.[key]
  }, obj)
}

/**
 * Format a path for display (e.g., add brackets for array indices)
 */
export function formatPath(path: string): string {
  // Convert numeric path segments to bracket notation
  // e.g., "items.0.name" -> "items[0].name"
  return path.replace(/\.(\d+)/g, '[$1]')
}

/**
 * Get a human-readable display string for a value
 */
export function getValueDisplay(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

/**
 * Detect array changes with more granularity
 * Returns whether arrays differ and how
 */
function compareArrays(
  oldArr: unknown[],
  newArr: unknown[]
): {
  changed: boolean
  itemsAdded: number
  itemsRemoved: number
} {
  const oldLen = oldArr.length
  const newLen = newArr.length

  // Quick check: if lengths differ, definitely changed
  if (oldLen !== newLen) {
    return {
      changed: true,
      itemsAdded: Math.max(0, newLen - oldLen),
      itemsRemoved: Math.max(0, oldLen - newLen),
    }
  }

  // Check each item
  for (let i = 0; i < oldLen; i++) {
    if (JSON.stringify(oldArr[i]) !== JSON.stringify(newArr[i])) {
      return {
        changed: true,
        itemsAdded: 0,
        itemsRemoved: 0,
      }
    }
  }

  return { changed: false, itemsAdded: 0, itemsRemoved: 0 }
}

/**
 * Main diff calculation function
 */
export function calculateDiff(
  current: Record<string, unknown>,
  previous: Record<string, unknown>,
  options: DiffOptions = {}
): DiffResult {
  const { maxDepth, ignoreKeys = [], includeUnchanged = false } = options

  const currentKeys = getNestedKeys(current, '', maxDepth).filter(
    (k) => !ignoreKeys.some((ik) => k === ik || k.startsWith(`${ik}.`))
  )
  const previousKeys = getNestedKeys(previous, '', maxDepth).filter(
    (k) => !ignoreKeys.some((ik) => k === ik || k.startsWith(`${ik}.`))
  )

  const addedKeys = currentKeys.filter((key) => !previousKeys.includes(key))
  const removedKeys = previousKeys.filter((key) => !currentKeys.includes(key))
  const commonKeys = currentKeys.filter((key) => previousKeys.includes(key))

  const changes: DiffChange[] = []

  // Added changes
  for (const path of addedKeys) {
    changes.push({
      path,
      type: 'added',
      newValue: getNestedValue(current, path),
    })
  }

  // Removed changes
  for (const path of removedKeys) {
    changes.push({
      path,
      type: 'removed',
      oldValue: getNestedValue(previous, path),
    })
  }

  // Check common keys for modifications
  for (const path of commonKeys) {
    const currentValue = getNestedValue(current, path)
    const previousValue = getNestedValue(previous, path)
    const currentType = getValueType(currentValue)
    const previousType = getValueType(previousValue)

    // Type change detection
    if (currentType !== previousType) {
      changes.push({
        path,
        type: 'modified',
        oldValue: previousValue,
        newValue: currentValue,
        typeChange: {
          from: previousType,
          to: currentType,
        },
      })
    } else if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
      // Value changed but type is the same
      changes.push({
        path,
        type: 'modified',
        oldValue: previousValue,
        newValue: currentValue,
      })
    } else if (includeUnchanged) {
      // Unchanged
      changes.push({
        path,
        type: 'unchanged',
        oldValue: previousValue,
        newValue: currentValue,
      })
    }
  }

  // Group by type
  const byType = {
    added: changes.filter((c) => c.type === 'added'),
    removed: changes.filter((c) => c.type === 'removed'),
    modified: changes.filter((c) => c.type === 'modified'),
    unchanged: changes.filter((c) => c.type === 'unchanged'),
  }

  // Calculate summary
  const summary: DiffSummary = {
    added: byType.added.length,
    removed: byType.removed.length,
    modified: byType.modified.length,
    unchanged: byType.unchanged.length,
    total:
      byType.added.length +
      byType.removed.length +
      byType.modified.length +
      byType.unchanged.length,
  }

  return { changes, summary, byType }
}

// Schema-specific helpers (for Phase 7 cross-schema comparison)

import type { Schema } from '@/models/Schema'

/**
 * Compare two Schema objects by their content
 */
export function diffSchemas(schemaA: Schema, schemaB: Schema): DiffResult {
  return calculateDiff(schemaA.content, schemaB.content)
}
