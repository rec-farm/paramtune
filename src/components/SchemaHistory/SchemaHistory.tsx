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
          <h3 className="text-lg font-semibold">Schema History</h3>
          <p className="text-sm text-muted-foreground">
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
                  className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
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
                    <span
                      className="text-xs text-muted-foreground"
                      title={absolute}
                    >
                      {relative}
                    </span>
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
                <Badge variant="outline" className="text-xs">
                  {formatTimestamp(selectedEntry.timestamp).absolute}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <h5 className="text-sm font-medium mb-2">Schema Content</h5>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedEntry.content, null, 2)}
                    </pre>
                  </div>
                </div>

                {selectedEntry.dependencies.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-2">Dependencies</h5>
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
                    <h5 className="text-sm font-medium mb-2">
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
