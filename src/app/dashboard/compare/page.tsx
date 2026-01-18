import { getPlatforms } from '@/models/Platform'
import { getPlatform } from '@/models/Platform'
import { compareSchemas } from '@/models/Schema'
import CompareForm from './CompareForm'

export const dynamic = 'force-dynamic'

export default async function ComparePage() {
  const platforms = await getPlatforms()

  // Server action to get versions for a platform
  async function getVersionsAction(platformName: string) {
    'use server'
    const platform = await getPlatform(platformName)
    return platform?.versions || []
  }

  // Server action to compare schemas
  async function compareSchemasAction(
    platformA: string,
    versionA: string,
    platformB: string,
    versionB: string
  ) {
    'use server'
    return compareSchemas(platformA, versionA, platformB, versionB)
  }

  return (
    <div className="space-y-6 mx-auto max-w-6xl px-2 md:px-0">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Compare Schemas</h1>
        <p className="text-sm text-muted-foreground">
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
