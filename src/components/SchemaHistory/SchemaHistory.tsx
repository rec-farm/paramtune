'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import SchemaDiff from './SchemaDiff'
import type { SchemaHistoryEntry } from '@/models/Schema'

interface SchemaHistoryProps {
  history: Array<SchemaHistoryEntry & { timestamp: number }>
  currentSchema?: SchemaHistoryEntry
}

export default function SchemaHistory({
  history,
  currentSchema,
}: SchemaHistoryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showDiff, setShowDiff] = useState(false)

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
      default:
        const prevEntry = history[index - 1]
        const currentKeys = Object.keys(entry.content || {})
        const prevKeys = Object.keys(prevEntry.content || {})

        if (currentKeys.length > prevKeys.length) {
          return `Added ${currentKeys.length - prevKeys.length} properties`
        } else if (currentKeys.length < prevKeys.length) {
          return `Removed ${prevKeys.length - currentKeys.length} properties`
        } else {
          return 'Modified properties'
        }
    }
  }

  const selectedEntry = selectedIndex !== null ? history[selectedIndex] : null

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider">Schema History</h3>
          <p className="text-xs text-muted-foreground font-mono">
            {history.length} version{history.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDiff(!showDiff)}
            disabled={selectedIndex === null || selectedIndex === 0}
          >
            {showDiff ? 'Hide' : 'Show'} Diff
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* History List */}
        <Card className="p-3">
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {history.map((entry, index) => {
              const { relative, absolute } = formatTimestamp(entry.timestamp)
              const changeType = getChangeType(index)
              const isSelected = selectedIndex === index

              return (
                <div
                  key={entry.timestamp}
                  className={`p-2.5 border cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-primary/60 bg-primary/10'
                      : 'border-primary/20 hover:border-primary/40 hover:bg-black/30'
                  }`}
                  onClick={() => setSelectedIndex(index)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          changeType === 'latest'
                            ? 'default'
                            : changeType === 'initial'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {changeType === 'latest'
                          ? 'Current'
                          : changeType === 'initial'
                          ? 'Initial'
                          : 'Update'}
                      </Badge>
                      <span className="text-sm font-medium">
                        Version {history.length - index}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {entry.author ? (
                        <div className="flex items-center gap-1.5">
                          {entry.author.image ? (
                            <img
                              src={entry.author.image}
                              alt=""
                              className="h-4 w-4 rounded-full"
                            />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-[10px] font-medium">
                                {entry.author.name?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {entry.author.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Unknown</span>
                      )}
                      <span
                        className="text-xs text-muted-foreground"
                        title={absolute}
                      >
                        {relative}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">
                    {getChangeDescription(index)}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      {Object.keys(entry.content || {}).length} properties
                    </span>
                    {entry.dependencies.length > 0 && (
                      <span>{entry.dependencies.length} dependencies</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Selected Entry Details */}
        <Card className="p-3">
          {selectedEntry ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  Version {history.length - (selectedIndex ?? 0)} Details
                </h4>
                <div className="flex items-center gap-3">
                  {selectedEntry.author ? (
                    <div className="flex items-center gap-1.5">
                      {selectedEntry.author.image ? (
                        <img
                          src={selectedEntry.author.image}
                          alt=""
                          className="h-5 w-5 rounded-full"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {selectedEntry.author.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <span className="text-sm">{selectedEntry.author.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground italic">Unknown author</span>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {formatTimestamp(selectedEntry.timestamp).absolute}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h5 className="text-xs font-medium uppercase tracking-wider mb-2">Schema Content</h5>
                  <div className="bg-black/50 border border-primary/30 p-3">
                    <pre className="text-xs font-mono overflow-x-auto">
                      {JSON.stringify(selectedEntry.content, null, 2)}
                    </pre>
                  </div>
                </div>

                {selectedEntry.dependencies.length > 0 && (
                  <div>
                    <h5 className="text-xs font-medium uppercase tracking-wider mb-2">Dependencies</h5>
                    <div className="flex flex-wrap gap-1">
                      {selectedEntry.dependencies.map((dep, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-xs"
                        >
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {showDiff && selectedIndex !== null && selectedIndex > 0 && (
                  <div>
                    <h5 className="text-xs font-medium uppercase tracking-wider mb-2">
                      Changes from Version {history.length - selectedIndex + 1}
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
            <div className="text-center py-8 text-muted-foreground">
              <p>Select a version to view details</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
