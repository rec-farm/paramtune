import { getPlatforms } from '@/models/Platform'
import { getPlatform } from '@/models/Platform'
import { compareSchemasWithContent } from '@/models/Schema'
import { type DiffResult } from '@/lib/schemaDiff'
import { sortVersionsDescending } from '@/lib/versionUtils'
import { requireDashboardSession } from '@/lib/dashboardAuth'
import { headers } from 'next/headers'
import CompareForm from './CompareForm'

export const dynamic = 'force-dynamic'

export type CompareResult = {
  diffResult: DiffResult
  schemaAContent: Record<string, unknown>
  schemaBContent: Record<string, unknown>
}

export default async function ComparePage() {
  const platforms = await getPlatforms()

  // Server action to get versions for a platform
  async function getVersionsAction(platformName: string) {
    'use server'
    await requireDashboardSession(await headers())
    const platform = await getPlatform(platformName)
    return sortVersionsDescending(platform?.versions ?? [])
  }

  // Server action to compare schemas and return content
  async function compareSchemasAction(
    platformA: string,
    versionA: string,
    platformB: string,
    versionB: string
  ): Promise<CompareResult> {
    'use server'
    await requireDashboardSession(await headers())
    return compareSchemasWithContent(platformA, versionA, platformB, versionB)
  }

  return (
    <div className="space-y-6 mx-auto max-w-6xl px-2 md:px-0">
      <header className="space-y-2">
        <h1 className="text-2xl font-display font-bold tracking-widest uppercase">
          COMPARE_SCHEMAS
        </h1>
        <p className="text-xs text-gray-500 font-fragmented uppercase tracking-wider">
          Compare schemas across different platforms and versions to see what changed
        </p>
      </header>

      <CompareForm
        platforms={platforms}
        getVersions={getVersionsAction}
        compareSchemas={compareSchemasAction}
      />
    </div>
  )
}
