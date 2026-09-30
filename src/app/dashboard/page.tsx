import Card from '@/components/ui/Card'
import CreatePlatformForm from '@/components/CreatePlatformForm'
import {
  getPlatforms,
  savePlatform,
  EmptyPlatformNameError,
  type Platform,
} from '@/models/Platform'
import { isValidName, MAX_NAME_LENGTH } from '@/lib/apiHandler'
import { getLatestVersion } from '@/lib/versionUtils'
import { requireDashboardSession } from '@/lib/dashboardAuth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const platforms = await getPlatforms()

  async function createPlatform(formData: FormData) {
    'use server'

    await requireDashboardSession(await headers())

    const platformName = formData.get('platformName') as string
    const trimmedName = platformName?.trim() ?? ''

    if (!trimmedName) {
      throw new EmptyPlatformNameError()
    }

    if (!isValidName(trimmedName)) {
      throw new Error(
        `Invalid platform name "${trimmedName}": only alphanumeric characters, underscores, hyphens, and dots are allowed (max ${MAX_NAME_LENGTH} characters)`
      )
    }

    try {
      await savePlatform(trimmedName, {
        name: trimmedName,
        versions: [],
      })
      revalidatePath('/dashboard')
    } catch (error) {
      console.error('Error saving platform:', error)
      throw error
    }
  }

  return (
    <div className="space-y-8">
      <h1 className="pt-display text-xl">Platforms</h1>
      <Card
        title="All platforms"
        subtitle="Manage and configure your application platforms"
      >
        {platforms.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <h3 className="font-bold">No platforms yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Platforms group the versions and schemas for one app or service.
              Create your first one below to get started.
            </p>
            <a href="#create-platform" className="pt-btn pt-btn-secondary mt-4">
              Create platform
            </a>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform: Platform) => {
              const latestVersion = getLatestVersion(platform.versions)
              const href = `/dashboard/${encodeURIComponent(platform.name)}`
              const versionCount = platform.versions?.length || 0
              return (
                <li key={platform.name}>
                  <Link
                    href={href}
                    className="group flex h-full flex-col justify-between gap-4 border border-border bg-surface p-4 transition-colors duration-150 hover:bg-surface-2 hover:border-border-strong"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <h3 className="font-bold truncate">{platform.name}</h3>
                        <p className="text-sm text-muted-foreground tabular-nums">
                          {versionCount}{' '}
                          {versionCount === 1 ? 'version' : 'versions'}
                          {latestVersion && (
                            <>
                              {' · latest '}
                              <span className="text-foreground">
                                v{latestVersion}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-meta"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="pt-label text-muted-foreground">
                      Open configs
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card
        id="create-platform"
        title="Create platform"
        subtitle="Add a new platform to manage its configurations"
      >
        <CreatePlatformForm action={createPlatform} />
      </Card>
    </div>
  )
}
