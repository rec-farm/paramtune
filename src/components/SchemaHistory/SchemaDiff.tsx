import { useMemo } from 'react'
import Badge from '@/components/ui/Badge'
import {
  calculateDiff,
  formatPath,
  getValueDisplay,
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
      <div className="border border-border bg-surface p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No changes between these versions.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h4 className="pt-label text-muted-foreground mr-2">Summary</h4>
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

      <ul className="border border-border bg-surface font-mono text-xs divide-y divide-border">
        {byType.added.map((change) => (
          <li
            key={`added-${change.path}`}
            className="flex items-start gap-3 px-3 py-2 bg-diff-add"
          >
            <span className="w-3 shrink-0 text-success" aria-label="Added">+</span>
            <div className="flex-1 min-w-0 space-y-1">
              <code className="text-foreground break-all">{formatPath(change.path)}</code>
              <div className="text-diff-add-fg break-all">{getValueDisplay(change.newValue)}</div>
            </div>
          </li>
        ))}

        {byType.removed.map((change) => (
          <li
            key={`removed-${change.path}`}
            className="flex items-start gap-3 px-3 py-2 bg-diff-del"
          >
            <span className="w-3 shrink-0 text-danger" aria-label="Removed">−</span>
            <div className="flex-1 min-w-0 space-y-1">
              <code className="text-foreground break-all line-through decoration-danger/60">
                {formatPath(change.path)}
              </code>
              <div className="text-diff-del-fg break-all">{getValueDisplay(change.oldValue)}</div>
            </div>
          </li>
        ))}

        {byType.modified.map((change) => (
          <li
            key={`modified-${change.path}`}
            className="flex items-start gap-3 px-3 py-2 bg-diff-chg"
          >
            <span className="w-3 shrink-0 text-warn" aria-label="Changed">~</span>
            <div className="flex-1 min-w-0 space-y-1">
              <code className="text-foreground break-all">
                {formatPath(change.path)}
                {change.typeChange && (
                  <span className="ml-2 text-muted-foreground">
                    (type: {change.typeChange.from} → {change.typeChange.to})
                  </span>
                )}
              </code>
              <div className="flex items-start gap-2 text-diff-del-fg">
                <span aria-hidden="true">−</span>
                <span className="break-all">{getValueDisplay(change.oldValue)}</span>
              </div>
              <div className="flex items-start gap-2 text-diff-add-fg">
                <span aria-hidden="true">+</span>
                <span className="break-all">{getValueDisplay(change.newValue)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
