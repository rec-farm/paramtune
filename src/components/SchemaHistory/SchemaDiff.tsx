'use client'

import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import {
  calculateDiff,
  formatPath,
  getNestedValue,
  getValueDisplay,
  type DiffResult,
} from '@/lib/schemaDiff'

interface SchemaDiffProps {
  current: Record<string, unknown>
  previous: Record<string, unknown>
}

export default function SchemaDiff({ current, previous }: SchemaDiffProps) {
  const diff = useMemo(
    () => calculateDiff(current, previous),
    [current, previous]
  )

  const { summary, byType } = diff
  const hasChanges = summary.added > 0 || summary.removed > 0 || summary.modified > 0

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
          {summary.added > 0 && (
            <Badge variant="default" className="text-xs">
              +{summary.added} added
            </Badge>
          )}
          {summary.removed > 0 && (
            <Badge variant="destructive" className="text-xs">
              -{summary.removed} removed
            </Badge>
          )}
          {summary.modified > 0 && (
            <Badge variant="secondary" className="text-xs">
              ~{summary.modified} modified
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {byType.added.length > 0 && (
          <div>
            <h5 className="text-sm font-medium mb-2 text-green-600">
              Added Properties
            </h5>
            <div className="space-y-1">
              {byType.added.map((change) => (
                <div
                  key={change.path}
                  className="flex items-start gap-2 p-2 bg-green-50 rounded border-l-2 border-green-500"
                >
                  <span className="text-green-600 font-mono text-xs">+</span>
                  <div className="flex-1 min-w-0">
                    <code className="text-xs font-medium text-green-800">
                      {formatPath(change.path)}
                    </code>
                    <div className="text-xs text-green-700 mt-1">
                      {getValueDisplay(change.newValue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {byType.removed.length > 0 && (
          <div>
            <h5 className="text-sm font-medium mb-2 text-red-600">
              Removed Properties
            </h5>
            <div className="space-y-1">
              {byType.removed.map((change) => (
                <div
                  key={change.path}
                  className="flex items-start gap-2 p-2 bg-red-50 rounded border-l-2 border-red-500"
                >
                  <span className="text-red-600 font-mono text-xs">-</span>
                  <div className="flex-1 min-w-0">
                    <code className="text-xs font-medium text-red-800">
                      {formatPath(change.path)}
                    </code>
                    <div className="text-xs text-red-700 mt-1">
                      {getValueDisplay(change.oldValue)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {byType.modified.length > 0 && (
          <div>
            <h5 className="text-sm font-medium mb-2 text-blue-600">
              Modified Properties
            </h5>
            <div className="space-y-1">
              {byType.modified.map((change) => (
                <div
                  key={change.path}
                  className="p-2 bg-blue-50 rounded border-l-2 border-blue-500"
                >
                  <code className="text-xs font-medium text-blue-800">
                    {formatPath(change.path)}
                  </code>
                  {change.typeChange && (
                    <span className="ml-2 text-xs text-blue-500">
                      (type: {change.typeChange.from} → {change.typeChange.to})
                    </span>
                  )}
                  <div className="mt-2 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-mono text-xs">
                        -
                      </span>
                      <div className="text-xs text-red-700 font-mono bg-red-100 p-1 rounded">
                        {getValueDisplay(change.oldValue)}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600 font-mono text-xs">
                        +
                      </span>
                      <div className="text-xs text-green-700 font-mono bg-green-100 p-1 rounded">
                        {getValueDisplay(change.newValue)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
