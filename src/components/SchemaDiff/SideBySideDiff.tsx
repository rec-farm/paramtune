'use client'

import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import {
  type DiffResult,
  type DiffChange,
  getValueDisplay,
} from '@/lib/schemaDiff'

interface SideBySideDiffProps {
  schemaA: Record<string, unknown>
  schemaB: Record<string, unknown>
  diffResult: DiffResult
  labelA?: string
  labelB?: string
}

export default function SideBySideDiff({
  schemaA,
  schemaB,
  diffResult,
  labelA = 'Schema A',
  labelB = 'Schema B',
}: SideBySideDiffProps) {
  const { summary, byType } = diffResult
  const hasChanges =
    summary.added > 0 || summary.removed > 0 || summary.modified > 0

  // Group all changed paths for highlighting
  const changedPaths = useMemo(() => {
    const paths = new Map<
      string,
      { type: DiffChange['type']; change: DiffChange }
    >()
    for (const change of diffResult.changes) {
      paths.set(change.path, { type: change.type, change })
    }
    return paths
  }, [diffResult.changes])

  if (!hasChanges) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <p className="font-medium">Schemas are identical</p>
          <p className="text-sm mt-1">No differences found between the two schemas</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex items-center gap-4 flex-wrap">
        <h3 className="font-medium">Changes Summary</h3>
        <div className="flex items-center gap-2">
          {summary.added > 0 && (
            <Badge variant="success" className="text-xs">
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

      {/* Side-by-side view */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Schema A panel */}
        <Card className="p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
            <Badge variant="secondary">A</Badge>
            <span className="font-medium text-sm">{labelA}</span>
          </div>
          <div className="overflow-auto max-h-[500px]">
            <SchemaView
              schema={schemaA}
              changedPaths={changedPaths}
              side="left"
            />
          </div>
        </Card>

        {/* Schema B panel */}
        <Card className="p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
            <Badge variant="secondary">B</Badge>
            <span className="font-medium text-sm">{labelB}</span>
          </div>
          <div className="overflow-auto max-h-[500px]">
            <SchemaView
              schema={schemaB}
              changedPaths={changedPaths}
              side="right"
            />
          </div>
        </Card>
      </div>

      {/* Detailed changes list */}
      <Card className="p-5">
        <h4 className="font-medium mb-4">Detailed Changes</h4>
        <div className="space-y-3">
          {byType.added.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-green-600 dark:text-green-400">
                Added Properties
              </h5>
              <div className="space-y-1">
                {byType.added.map((change) => (
                  <ChangeRow key={change.path} change={change} />
                ))}
              </div>
            </div>
          )}

          {byType.removed.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-red-600 dark:text-red-400">
                Removed Properties
              </h5>
              <div className="space-y-1">
                {byType.removed.map((change) => (
                  <ChangeRow key={change.path} change={change} />
                ))}
              </div>
            </div>
          )}

          {byType.modified.length > 0 && (
            <div>
              <h5 className="text-sm font-medium mb-2 text-blue-600 dark:text-blue-400">
                Modified Properties
              </h5>
              <div className="space-y-1">
                {byType.modified.map((change) => (
                  <ChangeRow key={change.path} change={change} />
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// Schema JSON view with diff highlighting
function SchemaView({
  schema,
  changedPaths,
  side,
}: {
  schema: Record<string, unknown>
  changedPaths: Map<string, { type: DiffChange['type']; change: DiffChange }>
  side: 'left' | 'right'
}) {
  // Render the schema as formatted JSON with highlighting
  const lines = useMemo(() => {
    return renderJsonWithHighlights(schema, changedPaths, side)
  }, [schema, changedPaths, side])

  return (
    <pre className="text-xs font-mono leading-relaxed">
      {lines.map((line, index) => (
        <div
          key={index}
          className={getLineClassName(line.highlight, side)}
        >
          <span className="select-none text-muted-foreground/50 pr-3 inline-block w-8 text-right">
            {index + 1}
          </span>
          <span>{line.content}</span>
        </div>
      ))}
    </pre>
  )
}

type LineHighlight = 'added' | 'removed' | 'modified' | null

interface JsonLine {
  content: string
  highlight: LineHighlight
  path?: string
}

function renderJsonWithHighlights(
  obj: Record<string, unknown>,
  changedPaths: Map<string, { type: DiffChange['type']; change: DiffChange }>,
  side: 'left' | 'right',
  prefix = '',
  indent = 0
): JsonLine[] {
  const lines: JsonLine[] = []
  const indentStr = '  '.repeat(indent)
  const entries = Object.entries(obj)

  if (entries.length === 0) {
    lines.push({ content: `${indentStr}{}`, highlight: null })
    return lines
  }

  lines.push({ content: `${indentStr}{`, highlight: null })

  entries.forEach(([key, value], index) => {
    const path = prefix ? `${prefix}.${key}` : key
    const change = changedPaths.get(path)
    const isLast = index === entries.length - 1
    const comma = isLast ? '' : ','

    let highlight: LineHighlight = null
    if (change) {
      if (change.type === 'added' && side === 'right') {
        highlight = 'added'
      } else if (change.type === 'removed' && side === 'left') {
        highlight = 'removed'
      } else if (change.type === 'modified') {
        highlight = 'modified'
      }
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Nested object
      lines.push({
        content: `${'  '.repeat(indent + 1)}"${key}": {`,
        highlight,
        path,
      })
      const nested = renderJsonWithHighlights(
        value as Record<string, unknown>,
        changedPaths,
        side,
        path,
        indent + 2
      )
      // Skip first { and last } from nested
      lines.push(...nested.slice(1, -1))
      lines.push({
        content: `${'  '.repeat(indent + 1)}}${comma}`,
        highlight,
        path,
      })
    } else if (Array.isArray(value)) {
      // Array value
      const valueStr = JSON.stringify(value)
      if (valueStr.length < 60) {
        lines.push({
          content: `${'  '.repeat(indent + 1)}"${key}": ${valueStr}${comma}`,
          highlight,
          path,
        })
      } else {
        // Multi-line array
        lines.push({
          content: `${'  '.repeat(indent + 1)}"${key}": [`,
          highlight,
          path,
        })
        value.forEach((item, i) => {
          const itemComma = i === value.length - 1 ? '' : ','
          lines.push({
            content: `${'  '.repeat(indent + 2)}${JSON.stringify(item)}${itemComma}`,
            highlight,
            path,
          })
        })
        lines.push({
          content: `${'  '.repeat(indent + 1)}]${comma}`,
          highlight,
          path,
        })
      }
    } else {
      // Primitive value
      const valueStr = JSON.stringify(value)
      lines.push({
        content: `${'  '.repeat(indent + 1)}"${key}": ${valueStr}${comma}`,
        highlight,
        path,
      })
    }
  })

  lines.push({ content: `${indentStr}}`, highlight: null })
  return lines
}

function getLineClassName(highlight: LineHighlight, side: 'left' | 'right'): string {
  const base = 'py-0.5 px-2 -mx-2'

  if (!highlight) return base

  switch (highlight) {
    case 'added':
      return `${base} bg-green-100 dark:bg-green-950/50`
    case 'removed':
      return `${base} bg-red-100 dark:bg-red-950/50`
    case 'modified':
      return side === 'left'
        ? `${base} bg-amber-100 dark:bg-amber-950/50`
        : `${base} bg-blue-100 dark:bg-blue-950/50`
    default:
      return base
  }
}

// Individual change row in the detailed view
function ChangeRow({ change }: { change: DiffChange }) {
  const bgClass =
    change.type === 'added'
      ? 'bg-green-50 dark:bg-green-950/30 border-green-500'
      : change.type === 'removed'
        ? 'bg-red-50 dark:bg-red-950/30 border-red-500'
        : 'bg-blue-50 dark:bg-blue-950/30 border-blue-500'

  const textClass =
    change.type === 'added'
      ? 'text-green-800 dark:text-green-300'
      : change.type === 'removed'
        ? 'text-red-800 dark:text-red-300'
        : 'text-blue-800 dark:text-blue-300'

  return (
    <div className={`p-2 rounded border-l-2 ${bgClass}`}>
      <div className="flex items-start gap-2">
        <span className={`font-mono text-xs ${textClass}`}>
          {change.type === 'added' ? '+' : change.type === 'removed' ? '-' : '~'}
        </span>
        <div className="flex-1 min-w-0">
          <code className={`text-xs font-medium ${textClass}`}>
            {change.path}
          </code>
          {change.typeChange && (
            <span className="ml-2 text-xs text-muted-foreground">
              (type: {change.typeChange.from} → {change.typeChange.to})
            </span>
          )}
          {change.type === 'modified' && (
            <div className="mt-2 space-y-1">
              <div className="flex items-start gap-2">
                <span className="text-red-600 dark:text-red-400 font-mono text-xs">-</span>
                <div className="text-xs font-mono bg-red-100 dark:bg-red-950/50 p-1 rounded overflow-auto max-w-full">
                  {getValueDisplay(change.oldValue)}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400 font-mono text-xs">+</span>
                <div className="text-xs font-mono bg-green-100 dark:bg-green-950/50 p-1 rounded overflow-auto max-w-full">
                  {getValueDisplay(change.newValue)}
                </div>
              </div>
            </div>
          )}
          {change.type === 'added' && change.newValue !== undefined && (
            <div className="mt-1 text-xs font-mono text-green-700 dark:text-green-300">
              {getValueDisplay(change.newValue)}
            </div>
          )}
          {change.type === 'removed' && change.oldValue !== undefined && (
            <div className="mt-1 text-xs font-mono text-red-700 dark:text-red-300">
              {getValueDisplay(change.oldValue)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
