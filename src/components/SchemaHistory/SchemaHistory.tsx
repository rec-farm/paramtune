import { useState, useTransition } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { FilePlus2, GitCommitHorizontal, History, Loader2, RotateCcw } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import SchemaDiff from './SchemaDiff'
import type { SchemaHistoryEntry } from '@/shared/contracts'

interface SchemaHistoryProps {
  history: Array<SchemaHistoryEntry & { timestamp: number }>
  onRestore?: (content: Record<string, unknown>) => Promise<void>
}

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`
}

export default function SchemaHistory({
  history,
  onRestore,
}: SchemaHistoryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showDiff, setShowDiff] = useState(false)
  const [restoreError, setRestoreError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleRestore = (content: Record<string, unknown>) => {
    startTransition(async () => {
      setRestoreError(null)
      try {
        await onRestore?.(content)
        setSelectedIndex(null)
      } catch (error) {
        setRestoreError(error instanceof Error ? error.message : 'Restore failed')
      }
    })
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      absolute: date.toLocaleString(),
    }
  }

  const getChangeType = (index: number) => {
    if (index === 0) return 'latest'
    if (index === history.length - 1) return 'initial'
    return 'update'
  }

  const getChangeDescription = (index: number) => {
    const changeType = getChangeType(index)
    const entry = history[index]

    switch (changeType) {
      case 'latest':
        return 'Current version'
      case 'initial':
        return 'Initial schema'
      default: {
        // History is newest first, so the revision this one replaced is next
        const prevEntry = history[index + 1]
        const currentKeys = Object.keys(entry.content || {})
        const prevKeys = Object.keys(prevEntry.content || {})

        if (currentKeys.length > prevKeys.length) {
          return `Added ${plural(currentKeys.length - prevKeys.length, 'property', 'properties')}`
        } else if (currentKeys.length < prevKeys.length) {
          return `Removed ${plural(prevKeys.length - currentKeys.length, 'property', 'properties')}`
        } else {
          return 'Modified properties'
        }
      }
    }
  }

  const selectedEntry = selectedIndex !== null ? history[selectedIndex] : null

  const renderAuthor = (
    author: SchemaHistoryEntry['author'] | undefined,
    size: 16 | 20
  ) => {
    if (!author) {
      return <span className="text-muted-foreground">Unknown</span>
    }
    const box = size === 16 ? 'h-4 w-4' : 'h-5 w-5'
    return (
      <span className="flex items-center gap-2 min-w-0 text-muted-foreground">
        {author.image ? (
          <img
            src={author.image}
            alt=""
            width={size}
            height={size}
            className={`${box} shrink-0`}
          />
        ) : (
          <span
            className={`${box} shrink-0 border border-border-strong flex items-center justify-center text-xs text-foreground`}
            aria-hidden="true"
          >
            {author.name?.charAt(0).toUpperCase() || '?'}
          </span>
        )}
        <span className="truncate">{author.name}</span>
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {restoreError && <p role="alert" className="text-danger">{restoreError}</p>}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="pt-heading">Schema history</h3>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono font-medium text-foreground tabular-nums">
              {history.length}
            </span>{' '}
            revision{history.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowDiff(!showDiff)}
          disabled={selectedIndex === null || selectedIndex === 0}
          aria-pressed={showDiff}
        >
          {showDiff ? 'Hide diff' : 'Show diff'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* History list */}
        <Card className="p-0 overflow-hidden">
          <ul className="max-h-96 overflow-y-auto divide-y divide-border" aria-label="Versions">
            {history.map((entry, index) => {
              const { relative, absolute } = formatTimestamp(entry.timestamp)
              const changeType = getChangeType(index)
              const isSelected = selectedIndex === index
              const ActionIcon = changeType === 'initial' ? FilePlus2 : GitCommitHorizontal
              const verb = changeType === 'initial' ? 'Created' : 'Updated'

              return (
                <li key={entry.timestamp}>
                  <button
                    type="button"
                    aria-current={isSelected ? 'true' : undefined}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors duration-150 ${
                      isSelected
                        ? 'bg-surface-3 shadow-[inset_2px_0_0_var(--primary-bg)]'
                        : 'hover:bg-surface-2'
                    }`}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <time
                        dateTime={new Date(entry.timestamp).toISOString()}
                        title={absolute}
                        className="font-mono text-xs text-meta tabular-nums"
                      >
                        {relative}
                      </time>
                      <span className="flex items-center gap-1 text-foreground">
                        <ActionIcon className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                        {verb}
                      </span>
                      <span className="font-mono text-foreground">
                        v{history.length - index}
                      </span>
                      <span className="text-xs">{renderAuthor(entry.author, 16)}</span>
                      {changeType === 'latest' && (
                        <Badge variant="default" className="ml-auto">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {getChangeDescription(index)} ·{' '}
                      <span className="tabular-nums">
                        {plural(
                          Object.keys(entry.content || {}).length,
                          'property',
                          'properties'
                        )}
                      </span>
                      {entry.dependencies.length > 0 && (
                        <>
                          {' '}·{' '}
                          <span className="tabular-nums">
                            {plural(
                              entry.dependencies.length,
                              'dependency',
                              'dependencies'
                            )}
                          </span>
                        </>
                      )}
                    </p>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>

        {/* Selected entry details */}
        <Card className="p-4">
          {selectedEntry ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-mono text-lg font-medium text-foreground">
                  v{history.length - (selectedIndex ?? 0)}
                </h4>
                <div className="flex items-center gap-3 text-xs">
                  {renderAuthor(selectedEntry.author, 20)}
                  <time
                    dateTime={new Date(selectedEntry.timestamp).toISOString()}
                    className="font-mono text-meta tabular-nums"
                  >
                    {formatTimestamp(selectedEntry.timestamp).absolute}
                  </time>
                </div>
              </div>

              {selectedIndex !== null && selectedIndex !== 0 && onRestore && (
                <div className="flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={isPending}
                    aria-busy={isPending}
                    onClick={() => handleRestore(selectedEntry.content)}
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />
                    ) : (
                      <RotateCcw className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                    )}
                    {isPending ? 'Restoring' : 'Restore this version'}
                  </Button>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h5 className="pt-label text-muted-foreground mb-2">Content</h5>
                  <pre className="pt-code text-xs overflow-x-auto text-foreground">
                    {JSON.stringify(selectedEntry.content, null, 2)}
                  </pre>
                </div>

                {selectedEntry.dependencies.length > 0 && (
                  <div>
                    <h5 className="pt-label text-muted-foreground mb-2">Dependencies</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.dependencies.map((dep, idx) => (
                        <Badge key={idx} variant="secondary" className="normal-case">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {showDiff && selectedIndex !== null && selectedIndex > 0 && (
                  <div>
                    <h5 className="pt-label text-muted-foreground mb-2">
                      Changes from version {history.length - selectedIndex + 1}
                    </h5>
                    <SchemaDiff
                      current={selectedEntry.content}
                      previous={history[selectedIndex - 1].content}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <History className="w-5 h-5 text-meta" strokeWidth={1.5} aria-hidden="true" />
              <p className="text-sm text-foreground">No version selected</p>
              <p className="text-sm text-muted-foreground">
                Pick a version from the list to see its content and changes.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
