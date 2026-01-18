'use client'

import { useState, useEffect, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { type Platform } from '@/models/Platform'
import { type DiffResult } from '@/lib/schemaDiff'

interface CompareFormProps {
  platforms: Platform[]
  getVersions: (platformName: string) => Promise<string[]>
  compareSchemas: (
    platformA: string,
    versionA: string,
    platformB: string,
    versionB: string
  ) => Promise<DiffResult>
}

type SchemaSelection = {
  platform: string
  version: string
}

export default function CompareForm({
  platforms,
  getVersions,
  compareSchemas,
}: CompareFormProps) {
  const searchParams = useSearchParams()

  // Initialize from URL params if present
  const [schemaA, setSchemaA] = useState<SchemaSelection>({
    platform: searchParams.get('platformA') || '',
    version: searchParams.get('versionA') || '',
  })
  const [schemaB, setSchemaB] = useState<SchemaSelection>({
    platform: searchParams.get('platformB') || '',
    version: searchParams.get('versionB') || '',
  })

  const [versionsA, setVersionsA] = useState<string[]>([])
  const [versionsB, setVersionsB] = useState<string[]>([])
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Initialize versions from URL params if present
  useEffect(() => {
    if (schemaA.platform) {
      getVersions(schemaA.platform).then(setVersionsA)
    }
    if (schemaB.platform) {
      getVersions(schemaB.platform).then(setVersionsB)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load versions when platform changes
  const handlePlatformChangeA = async (platformName: string) => {
    setSchemaA({ platform: platformName, version: '' })
    setDiffResult(null)
    setError(null)
    if (platformName) {
      const versions = await getVersions(platformName)
      setVersionsA(versions)
    } else {
      setVersionsA([])
    }
  }

  const handlePlatformChangeB = async (platformName: string) => {
    setSchemaB({ platform: platformName, version: '' })
    setDiffResult(null)
    setError(null)
    if (platformName) {
      const versions = await getVersions(platformName)
      setVersionsB(versions)
    } else {
      setVersionsB([])
    }
  }

  const canCompare =
    schemaA.platform &&
    schemaA.version &&
    schemaB.platform &&
    schemaB.version

  const handleCompare = () => {
    if (!canCompare) return

    setError(null)
    startTransition(async () => {
      try {
        const result = await compareSchemas(
          schemaA.platform,
          schemaA.version,
          schemaB.platform,
          schemaB.version
        )
        setDiffResult(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Comparison failed')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Selector panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Schema A selector */}
        <Card className="p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">A</Badge>
              <span className="font-medium">Source Schema</span>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="platformA"
                  className="block text-sm font-medium mb-1.5"
                >
                  Platform
                </label>
                <select
                  id="platformA"
                  value={schemaA.platform}
                  onChange={(e) => handlePlatformChangeA(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                >
                  <option value="">Select platform...</option>
                  {platforms.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="versionA"
                  className="block text-sm font-medium mb-1.5"
                >
                  Version
                </label>
                <select
                  id="versionA"
                  value={schemaA.version}
                  onChange={(e) =>
                    setSchemaA((prev) => ({ ...prev, version: e.target.value }))
                  }
                  disabled={!schemaA.platform}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select version...</option>
                  {versionsA.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Schema B selector */}
        <Card className="p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">B</Badge>
              <span className="font-medium">Target Schema</span>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="platformB"
                  className="block text-sm font-medium mb-1.5"
                >
                  Platform
                </label>
                <select
                  id="platformB"
                  value={schemaB.platform}
                  onChange={(e) => handlePlatformChangeB(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                >
                  <option value="">Select platform...</option>
                  {platforms.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="versionB"
                  className="block text-sm font-medium mb-1.5"
                >
                  Version
                </label>
                <select
                  id="versionB"
                  value={schemaB.version}
                  onChange={(e) =>
                    setSchemaB((prev) => ({ ...prev, version: e.target.value }))
                  }
                  disabled={!schemaB.platform}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Select version...</option>
                  {versionsB.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Compare button */}
      <div className="flex justify-center">
        <Button
          onClick={handleCompare}
          disabled={!canCompare || isPending}
          size="lg"
        >
          {isPending ? 'Comparing...' : 'Compare Schemas'}
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Card className="p-4 border-destructive/50 bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {/* Diff result display */}
      {diffResult && (
        <DiffDisplay
          diffResult={diffResult}
          schemaA={schemaA}
          schemaB={schemaB}
        />
      )}

      {/* Empty state */}
      {!diffResult && !error && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <p>Select two schemas to compare</p>
          </div>
        </Card>
      )}
    </div>
  )
}

// Inline diff display component (will be extracted to SideBySideDiff in Task 2)
function DiffDisplay({
  diffResult,
  schemaA,
  schemaB,
}: {
  diffResult: DiffResult
  schemaA: SchemaSelection
  schemaB: SchemaSelection
}) {
  const { summary, byType } = diffResult
  const hasChanges =
    summary.added > 0 || summary.removed > 0 || summary.modified > 0

  if (!hasChanges) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <p className="font-medium">Schemas are identical</p>
          <p className="text-sm mt-1">
            No differences found between {schemaA.platform}/{schemaA.version} and{' '}
            {schemaB.platform}/{schemaB.version}
          </p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-5">
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

        {/* Changes list - simple view for Task 1 */}
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
                    className="p-2 bg-green-50 dark:bg-green-950/30 rounded border-l-2 border-green-500"
                  >
                    <code className="text-xs font-medium text-green-800 dark:text-green-300">
                      {change.path}
                    </code>
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
                    className="p-2 bg-red-50 dark:bg-red-950/30 rounded border-l-2 border-red-500"
                  >
                    <code className="text-xs font-medium text-red-800 dark:text-red-300">
                      {change.path}
                    </code>
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
                    className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded border-l-2 border-blue-500"
                  >
                    <code className="text-xs font-medium text-blue-800 dark:text-blue-300">
                      {change.path}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
