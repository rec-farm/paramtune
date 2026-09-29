'use client'

import { useMemo } from 'react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import {
  type DiffResult,
  type DiffChange,
  formatPath,
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
        <div className="text-center">
          <p className="text-foreground">Schemas are identical</p>
          <p className="text-sm mt-1 text-muted-foreground">
            No differences found. Pick another version to compare.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex items-center gap-4 flex-wrap">
        <h3 className="pt-label text-muted-foreground">Summary</h3>
        <div className="flex flex-wrap items-center gap-2">
          {summary.added > 0 && (
            <Badge variant="success">+ {summary.added} added</Badge>
          )}
          {summary.removed > 0 && (
            <Badge variant="destructive">− {summary.removed} removed</Badge>
          )}
          {summary.modified > 0 && (
            <Badge variant="warning">~ {summary.modified} changed</Badge>
          )}
        </div>
      </div>

      {/* Unified view below 768px */}
      <Card className="p-4 overflow-hidden md:hidden">
        <div className="flex flex-wrap items-center gap-2 mb-3 pb-2 border-b border-border">
          <Badge variant="secondary">A</Badge>
          <span className="font-mono text-sm text-foreground">{labelA}</span>
          <span className="text-meta" aria-hidden="true">
            →
          </span>
          <Badge variant="secondary">B</Badge>
          <span className="font-mono text-sm text-foreground">{labelB}</span>
        </div>
        <div className="overflow-auto max-h-[500px]">
          <UnifiedView schemaA={schemaA} schemaB={schemaB} />
        </div>
      </Card>

      {/* Side-by-side view from 768px */}
      <div className="hidden md:grid grid-cols-2 gap-4">
        {/* Schema A panel */}
        <Card className="p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
            <Badge variant="secondary">A</Badge>
            <span className="font-mono text-sm text-foreground">{labelA}</span>
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
            <span className="font-mono text-sm text-foreground">{labelB}</span>
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
        <h4 className="pt-label text-muted-foreground mb-4">Detailed changes</h4>
        <div className="space-y-3">
          {byType.added.length > 0 && (
            <div>
              <h5 className="pt-label mb-2 text-success">
                + Added
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
              <h5 className="pt-label mb-2 text-danger">
                − Removed
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
              <h5 className="pt-label mb-2 text-warn">
                ~ Changed
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
          <span className="select-none text-meta pr-3 inline-block w-8 text-right tabular-nums">
            {index + 1}
          </span>
          <span
            className={`select-none inline-block w-4 ${getSymbolClassName(line.highlight)}`}
            aria-label={line.highlight ?? undefined}
          >
            {getSymbol(line.highlight)}
          </span>
          <span>{line.content}</span>
        </div>
      ))}
    </pre>
  )
}

type LineHighlight = 'added' | 'removed' | 'modified' | null

type UnifiedHighlight = LineHighlight | 'modified-old'

interface UnifiedLine {
  content: string
  highlight: UnifiedHighlight
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Pretty-print one `"key": value` entry, every line carrying the same highlight
function entryLines(
  key: string,
  value: unknown,
  indent: number,
  comma: string,
  highlight: UnifiedHighlight
): UnifiedLine[] {
  const pad = '  '.repeat(indent)
  const [first, ...rest] = (JSON.stringify(value, null, 2) ?? 'null').split('\n')
  const lines = [`${pad}"${key}": ${first}`, ...rest.map((l) => `${pad}${l}`)]
  lines[lines.length - 1] += comma
  return lines.map((content) => ({ content, highlight }))
}

// Merge two objects into one unified list of lines, comparing by value
function renderUnified(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
  indent = 0
): UnifiedLine[] {
  // B's key order, with A-only keys inserted after their predecessor in A
  const keys = Object.keys(b)
  let insertAt = 0
  for (const key of Object.keys(a)) {
    const idx = keys.indexOf(key)
    if (idx === -1) {
      keys.splice(insertAt, 0, key)
      insertAt += 1
    } else {
      insertAt = idx + 1
    }
  }

  const pad = '  '.repeat(indent)
  const lines: UnifiedLine[] = [{ content: `${pad}{`, highlight: null }]

  keys.forEach((key, index) => {
    const comma = index === keys.length - 1 ? '' : ','
    const inA = Object.prototype.hasOwnProperty.call(a, key)
    const inB = Object.prototype.hasOwnProperty.call(b, key)

    if (!inB) {
      lines.push(...entryLines(key, a[key], indent + 1, comma, 'removed'))
    } else if (!inA) {
      lines.push(...entryLines(key, b[key], indent + 1, comma, 'added'))
    } else if (isPlainObject(a[key]) && isPlainObject(b[key])) {
      const nested = renderUnified(a[key], b[key], indent + 1)
      lines.push({ content: `${'  '.repeat(indent + 1)}"${key}": {`, highlight: null })
      lines.push(...nested.slice(1, -1))
      lines.push({ content: `${'  '.repeat(indent + 1)}}${comma}`, highlight: null })
    } else if (JSON.stringify(a[key]) === JSON.stringify(b[key])) {
      lines.push(...entryLines(key, b[key], indent + 1, comma, null))
    } else {
      lines.push(...entryLines(key, a[key], indent + 1, comma, 'modified-old'))
      lines.push(...entryLines(key, b[key], indent + 1, comma, 'modified'))
    }
  })

  lines.push({ content: `${pad}}`, highlight: null })
  return lines
}

function UnifiedView({
  schemaA,
  schemaB,
}: {
  schemaA: Record<string, unknown>
  schemaB: Record<string, unknown>
}) {
  const lines = useMemo(
    () => renderUnified(schemaA, schemaB),
    [schemaA, schemaB]
  )

  return (
    <pre className="text-xs font-mono leading-relaxed">
      {lines.map((line, index) => {
        const isOld = line.highlight === 'modified-old'
        const highlight: LineHighlight =
          line.highlight === 'modified-old' ? 'modified' : line.highlight
        return (
          <div key={index} className={getLineClassName(highlight, 'left')}>
            <span
              className={`select-none inline-block w-4 ${getSymbolClassName(highlight)}`}
              aria-label={
                isOld
                  ? 'changed, old value'
                  : line.highlight === 'modified'
                    ? 'changed, new value'
                    : (line.highlight ?? undefined)
              }
            >
              {getSymbol(highlight)}
            </span>
            <span className={isOld ? 'text-muted-foreground line-through' : undefined}>
              {line.content}
            </span>
          </div>
        )
      })}
    </pre>
  )
}

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

function getLineClassName(highlight: LineHighlight, _side: 'left' | 'right'): string {
  const base = 'py-0.5 px-2 -mx-2'

  switch (highlight) {
    case 'added':
      return `${base} bg-[var(--pt-success-bg)]`
    case 'removed':
      return `${base} bg-[var(--pt-danger-bg)]`
    case 'modified':
      return `${base} bg-[var(--pt-warn-bg)]`
    default:
      return base
  }
}

function getSymbol(highlight: LineHighlight): string {
  switch (highlight) {
    case 'added':
      return '+'
    case 'removed':
      return '−'
    case 'modified':
      return '~'
    default:
      return ' '
  }
}

function getSymbolClassName(highlight: LineHighlight): string {
  switch (highlight) {
    case 'added':
      return 'text-success'
    case 'removed':
      return 'text-danger'
    case 'modified':
      return 'text-warn'
    default:
      return ''
  }
}

// Individual change row in the detailed view
function ChangeRow({ change }: { change: DiffChange }) {
  const bgClass =
    change.type === 'added'
      ? 'bg-[var(--pt-success-bg)]'
      : change.type === 'removed'
        ? 'bg-[var(--pt-danger-bg)]'
        : 'bg-[var(--pt-warn-bg)]'

  const symbolClass =
    change.type === 'added'
      ? 'text-success'
      : change.type === 'removed'
        ? 'text-danger'
        : 'text-warn'

  return (
    <div className={`px-3 py-2 ${bgClass}`}>
      <div className="flex items-start gap-3">
        <span className={`w-3 shrink-0 font-mono text-xs ${symbolClass}`}>
          {change.type === 'added' ? '+' : change.type === 'removed' ? '−' : '~'}
        </span>
        <div className="flex-1 min-w-0">
          <code className="text-xs text-foreground break-all">
            {formatPath(change.path)}
          </code>
          {change.typeChange && (
            <span className="ml-2 text-xs text-muted-foreground">
              (type: {change.typeChange.from} → {change.typeChange.to})
            </span>
          )}
          {change.type === 'modified' && (
            <div className="mt-2 space-y-1 font-mono text-xs">
              <div className="flex items-start gap-2 text-danger">
                <span aria-hidden="true">−</span>
                <div className="overflow-auto max-w-full">
                  {getValueDisplay(change.oldValue)}
                </div>
              </div>
              <div className="flex items-start gap-2 text-success">
                <span aria-hidden="true">+</span>
                <div className="overflow-auto max-w-full">
                  {getValueDisplay(change.newValue)}
                </div>
              </div>
            </div>
          )}
          {change.type === 'added' && change.newValue !== undefined && (
            <div className="mt-1 text-xs font-mono text-success break-all">
              {getValueDisplay(change.newValue)}
            </div>
          )}
          {change.type === 'removed' && change.oldValue !== undefined && (
            <div className="mt-1 text-xs font-mono text-danger break-all">
              {getValueDisplay(change.oldValue)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
