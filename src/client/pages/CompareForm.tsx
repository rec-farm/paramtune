import { useState, useEffect, useTransition } from 'react'
import { useSearchParams } from 'react-router'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { AlertCircle, Loader2 } from 'lucide-react'
import SideBySideDiff from '@/components/SchemaDiff/SideBySideDiff'
import { type Platform } from '@/shared/contracts'
import { type CompareResult } from '@/shared/contracts'
import EmptyState from '@/components/EmptyState'
import { CompareArt } from '@/components/illustrations'

interface CompareFormProps {
  platforms: Platform[]
  getVersions: (platformName: string) => Promise<string[]>
  compareSchemas: (
    platformA: string,
    versionA: string,
    platformB: string,
    versionB: string
  ) => Promise<CompareResult>
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
  const [searchParams] = useSearchParams()

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
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (schemaA.platform) {
      getVersions(schemaA.platform).then(
        (versions) => { if (!cancelled) setVersionsA(versions) },
        (error) => { if (!cancelled) setError(error instanceof Error ? error.message : 'Could not load versions') }
      )
    }
    return () => { cancelled = true }
  }, [schemaA.platform, getVersions])

  useEffect(() => {
    let cancelled = false
    if (schemaB.platform) {
      getVersions(schemaB.platform).then(
        (versions) => { if (!cancelled) setVersionsB(versions) },
        (error) => { if (!cancelled) setError(error instanceof Error ? error.message : 'Could not load versions') }
      )
    }
    return () => { cancelled = true }
  }, [schemaB.platform, getVersions])

  const handlePlatformChangeA = (platformName: string) => {
    setSchemaA({ platform: platformName, version: '' })
    setVersionsA([])
    setCompareResult(null)
    setError(null)
  }
  const handlePlatformChangeB = (platformName: string) => {
    setSchemaB({ platform: platformName, version: '' })
    setVersionsB([])
    setCompareResult(null)
    setError(null)
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
        setCompareResult(result)
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
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">A</Badge>
              <span className="text-lg font-bold">Source schema</span>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="platformA"
                  className="pt-label block mb-2"
                >
                  Platform
                </label>
                <select
                  id="platformA"
                  value={schemaA.platform}
                  onChange={(e) => handlePlatformChangeA(e.target.value)}
                  className="pt-select font-mono"
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
                  className="pt-label block mb-2"
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
                  className="pt-select font-mono"
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
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">B</Badge>
              <span className="text-lg font-bold">Target schema</span>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="platformB"
                  className="pt-label block mb-2"
                >
                  Platform
                </label>
                <select
                  id="platformB"
                  value={schemaB.platform}
                  onChange={(e) => handlePlatformChangeB(e.target.value)}
                  className="pt-select font-mono"
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
                  className="pt-label block mb-2"
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
                  className="pt-select font-mono"
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
      <div className="flex">
        <Button
          onClick={handleCompare}
          disabled={!canCompare || isPending}
          aria-busy={isPending}
          size="lg"
        >
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />
          )}
          {isPending ? 'Comparing' : 'Compare schemas'}
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div
          role="alert"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-sm border border-border border-l-4 border-l-danger-icon bg-surface-2 px-5 py-4"
        >
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-danger-icon" strokeWidth={1.5} aria-hidden="true" />
            <div>
              <p className="text-base font-semibold text-foreground">We couldn&apos;t compare those schemas</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCompare}
            disabled={!canCompare || isPending}
          >
            Try again
          </Button>
        </div>
      )}

      {/* Diff result display */}
      {compareResult && (
        <SideBySideDiff
          schemaA={compareResult.schemaAContent}
          schemaB={compareResult.schemaBContent}
          diffResult={compareResult.diffResult}
          labelA={`${schemaA.platform}/${schemaA.version}`}
          labelB={`${schemaB.platform}/${schemaB.version}`}
        />
      )}

      {/* Empty state */}
      {!compareResult && !error && (
        <Card className="p-0">
          <EmptyState
            visual={<CompareArt className="w-[200px] max-w-full h-auto" />}
            title="Pick two schemas"
            description="Choose a platform and version for A and B, then compare them."
          />
        </Card>
      )}
    </div>
  )
}
