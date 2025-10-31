'use client'

import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'

interface SchemaDiffProps {
  current: Record<string, unknown>
  previous: Record<string, unknown>
}

interface DiffResult {
  added: string[]
  removed: string[]
  modified: string[]
  unchanged: string[]
}

function getObjectKeys(obj: Record<string, unknown>): string[] {
  return Object.keys(obj).sort()
}

function getNestedKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    keys.push(fullKey)

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getNestedKeys(value as Record<string, unknown>, fullKey))
    }
  }

  return keys.sort()
}

function calculateDiff(
  current: Record<string, unknown>,
  previous: Record<string, unknown>
): DiffResult {
  const currentKeys = getNestedKeys(current)
  const previousKeys = getNestedKeys(previous)

  const added = currentKeys.filter((key) => !previousKeys.includes(key))
  const removed = previousKeys.filter((key) => !currentKeys.includes(key))
  const common = currentKeys.filter((key) => previousKeys.includes(key))

  const modified: string[] = []
  const unchanged: string[] = []

  for (const key of common) {
    const currentValue = getNestedValue(current, key)
    const previousValue = getNestedValue(previous, key)

    if (JSON.stringify(currentValue) !== JSON.stringify(previousValue)) {
      modified.push(key)
    } else {
      unchanged.push(key)
    }
  }

  return { added, removed, modified, unchanged }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key: string) => {
    return (current as Record<string, unknown>)?.[key]
  }, obj)
}

function getValueDisplay(value: unknown): string {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

export default function SchemaDiff({ current, previous }: SchemaDiffProps) {
  const diff = useMemo(
    () => calculateDiff(current, previous),
    [current, previous]
  )

  const hasChanges =
    diff.added.length > 0 || diff.removed.length > 0 || diff.modified.length > 0

  if (!hasChanges) {
    return (
      <Card className="p-4">
        <div className="text-center py-4 text-muted-foreground">
          <p>No changes detected between versions</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h4 className="font-medium">Changes Summary</h4>
        <div className="flex items-center gap-2">
          {diff.added.length > 0 && (
            <Badge variant="default" className="text-xs">
              +{diff.added.length} added
            </Badge>
          )}
          {diff.removed.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              -{diff.removed.length} removed
            </Badge>
          )}
          {diff.modified.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              ~{diff.modified.length} modified
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {diff.added.length > 0 && (
          <div>
            <h5 className="text-sm font-medium mb-2 text-green-600">
              Added Properties
            </h5>
            <div className="space-y-1">
              {diff.added.map((key) => (
                <div
                  key={key}
                  className="flex items-start gap-2 p-2 bg-green-50 rounded border-l-2 border-green-500"
                >
                  <span className="text-green-600 font-mono text-xs">+</span>
                  <div className="flex-1 min-w-0">
                    <code className="text-xs font-medium text-green-800">
                      {key}
                    </code>
                    <div className="text-xs text-green-700 mt-1">
                      {getValueDisplay(getNestedValue(current, key))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {diff.removed.length > 0 && (
          <div>
            <h5 className="text-sm font-medium mb-2 text-red-600">
              Removed Properties
            </h5>
            <div className="space-y-1">
              {diff.removed.map((key) => (
                <div
                  key={key}
                  className="flex items-start gap-2 p-2 bg-red-50 rounded border-l-2 border-red-500"
                >
                  <span className="text-red-600 font-mono text-xs">-</span>
                  <div className="flex-1 min-w-0">
                    <code className="text-xs font-medium text-red-800">
                      {key}
                    </code>
                    <div className="text-xs text-red-700 mt-1">
                      {getValueDisplay(getNestedValue(previous, key))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {diff.modified.length > 0 && (
          <div>
            <h5 className="text-sm font-medium mb-2 text-blue-600">
              Modified Properties
            </h5>
            <div className="space-y-1">
              {diff.modified.map((key) => {
                const currentValue = getNestedValue(current, key)
                const previousValue = getNestedValue(previous, key)

                return (
                  <div
                    key={key}
                    className="p-2 bg-blue-50 rounded border-l-2 border-blue-500"
                  >
                    <code className="text-xs font-medium text-blue-800">
                      {key}
                    </code>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-start gap-2">
                        <span className="text-red-600 font-mono text-xs">
                          -
                        </span>
                        <div className="text-xs text-red-700 font-mono bg-red-100 p-1 rounded">
                          {getValueDisplay(previousValue)}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-green-600 font-mono text-xs">
                          +
                        </span>
                        <div className="text-xs text-green-700 font-mono bg-green-100 p-1 rounded">
                          {getValueDisplay(currentValue)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
