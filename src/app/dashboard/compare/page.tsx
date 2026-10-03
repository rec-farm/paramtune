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
    <div className="space-y-8">
      <header className="pt-4 md:pt-8">
        <p className="pt-eyebrow">Tools</p>
        <h1 className="pt-title-1 mt-2">
          Compare<span className="pt-period">.</span>
        </h1>
        <p className="mt-3 max-w-[45ch] text-lg text-muted-foreground">
          Line up any two schemas and see exactly what changed.
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
