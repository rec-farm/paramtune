'use client'

import { useState, useEffect, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import SideBySideDiff from '@/components/SchemaDiff/SideBySideDiff'
import { type Platform } from '@/models/Platform'
import { type DiffResult } from '@/lib/schemaDiff'
import { type CompareResult } from './page'

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
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null)
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
    setCompareResult(null)
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
    setCompareResult(null)
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
        <Card className="p-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">A</Badge>
              <span className="text-sm font-medium uppercase tracking-wider">Source Schema</span>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="platformA"
                  className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                >
                  Platform
                </label>
                <select
                  id="platformA"
                  value={schemaA.platform}
                  onChange={(e) => handlePlatformChangeA(e.target.value)}
                  className="select"
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
                  className="block text-xs font-medium uppercase tracking-wider mb-1.5"
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
                  className="select"
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
              <span className="text-sm font-medium uppercase tracking-wider">Target Schema</span>
            </div>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="platformB"
                  className="block text-xs font-medium uppercase tracking-wider mb-1.5"
                >
                  Platform
                </label>
                <select
                  id="platformB"
                  value={schemaB.platform}
                  onChange={(e) => handlePlatformChangeB(e.target.value)}
                  className="select"
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
                  className="block text-xs font-medium uppercase tracking-wider mb-1.5"
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
                  className="select"
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
        <Card className="p-4 border-destructive/50 bg-black/50">
          <p className="text-sm text-destructive font-mono">{error}</p>
        </Card>
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
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <p>Select two schemas to compare</p>
          </div>
        </Card>
      )}
    </div>
  )
}
