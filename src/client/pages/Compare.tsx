import { useLoaderData } from 'react-router'
import { api, UI_API } from '@/client/api'
import type { Platform, CompareResult } from '@/shared/contracts'
import { sortVersionsDescending } from '@/lib/versionUtils'
import CompareForm from './CompareForm'


  async function getVersionsAction(platformName: string) {
    const versions = await api<string[]>(`/api/${encodeURIComponent(platformName)}/versions`)
    return sortVersionsDescending(versions)
  }
  async function compareSchemasAction(platformA: string, versionA: string, platformB: string, versionB: string) {
    return api<CompareResult>(`${UI_API}/compare`, {
      method: 'POST', body: JSON.stringify({ platformA, versionA, platformB, versionB }),
    })
  }

export default function ComparePage() {
  const platforms = useLoaderData() as Platform[]

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
