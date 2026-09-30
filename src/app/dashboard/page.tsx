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
import { getSchemaHistoryWithTimestamps } from '@/models/Schema'
import StatTiles from '@/components/StatTiles'
import EmptyState from '@/components/EmptyState'
import { PanelsArt, PlatformsArt } from '@/components/illustrations'
import { requireDashboardSession } from '@/lib/dashboardAuth'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import Link from 'next/link'
import {
  ChevronRight,
  CircleCheck,
  CircleDashed,
  GitBranch,
  Layers,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

type VersionStatus = {
  platform: string
  version: string
  savedAt?: number
  author?: string
  hasContent: boolean
}

// Latest saved revision per version, one Redis read each
async function getVersionStatuses(platforms: Platform[]) {
  const results = await Promise.allSettled(
    platforms.flatMap((platform) =>
      (platform.versions ?? []).map(async (version): Promise<VersionStatus> => {
        const [latest] = await getSchemaHistoryWithTimestamps(
          platform.name,
          version,
          1
        )
        return {
          platform: platform.name,
          version,
          savedAt: latest?.timestamp,
          author: latest?.author?.name,
          hasContent: Object.keys(latest?.content ?? {}).length > 0,
        }
      })
    )
  )
  const statuses = results.flatMap((r) =>
    r.status === 'fulfilled' ? [r.value] : []
  )
  return { statuses, failed: results.length - statuses.length }
}

const relativeTime = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

function formatRelative(timestamp: number) {
  const seconds = Math.round((timestamp - Date.now()) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return relativeTime.format(Math.round(seconds / size), unit)
    }
  }
  return 'just now'
}

export default async function Page() {
  const platforms = await getPlatforms()
  const { statuses, failed } = await getVersionStatuses(platforms)
  const versionCount = platforms.reduce(
    (sum, p) => sum + (p.versions?.length ?? 0),
    0
  )
  const configured = statuses.filter((s) => s.hasContent).length
  const empty = statuses.length - configured
  const lastSaved = statuses
    .filter((s) => s.savedAt !== undefined)
    .sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0))[0]

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
      <header className="flex items-center justify-between gap-8">
        <div className="space-y-2 min-w-0">
          <p className="pt-label text-meta">Your configs, at a glance</p>
          <h1 className="pt-display text-2xl">Overview</h1>
          <p className="text-muted-foreground">
            Every platform, version and schema in this workspace.
          </p>
        </div>
        <PanelsArt signature className="hidden md:block w-[320px] shrink-0 h-auto" />
      </header>

      <section aria-label="Workspace stats" className="space-y-3">
        <StatTiles
          tiles={[
            {
              label: 'Versions',
              value: versionCount,
              helper: 'Across all platforms',
              icon: GitBranch,
            },
            {
              label: 'Platforms',
              value: platforms.length,
              helper: 'Apps and services',
              icon: Layers,
            },
            {
              label: 'Configured',
              value: configured,
              helper: 'Versions with a schema',
              icon: CircleCheck,
              tone: configured > 0 ? 'success' : 'neutral',
            },
            {
              label: 'Empty',
              value: empty,
              helper: 'Versions still at {}',
              icon: CircleDashed,
              tone: empty > 0 ? 'warn' : 'neutral',
            },
          ]}
        />
        {failed > 0 ? (
          <p role="alert" className="text-sm text-danger">
            Couldn&apos;t read {failed} {failed === 1 ? 'version' : 'versions'}{' '}
            from Redis, so the counts above are incomplete.{' '}
            <Link href="/dashboard" prefetch={false} className="underline">
              Retry
            </Link>
          </p>
        ) : (
          lastSaved?.savedAt && (
            <p className="text-sm text-meta">
              Last saved{' '}
              <time dateTime={new Date(lastSaved.savedAt).toISOString()}>
                {formatRelative(lastSaved.savedAt)}
              </time>{' '}
              ·{' '}
              <Link
                href={`/dashboard/${encodeURIComponent(lastSaved.platform)}/${encodeURIComponent(lastSaved.version)}`}
                className="font-mono text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                {lastSaved.platform} v{lastSaved.version}
              </Link>
              {lastSaved.author && <> · {lastSaved.author}</>}
            </p>
          )
        )}
      </section>

      <Card
        title="All platforms"
        subtitle="Manage and configure your application platforms"
      >
        {platforms.length === 0 ? (
          <EmptyState
            visual={<PlatformsArt className="w-[220px] h-auto" />}
            title="No platforms yet"
            description="Platforms group the versions and schemas for one app or service. Create your first one to get started."
            action={
              <a href="#create-platform" className="pt-btn pt-btn-secondary">
                Create platform
              </a>
            }
          />
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform: Platform) => {
              const latestVersion = getLatestVersion(platform.versions)
              const href = `/dashboard/${encodeURIComponent(platform.name)}`
              const platformVersions = platform.versions?.length || 0
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
                          {platformVersions}{' '}
                          {platformVersions === 1 ? 'version' : 'versions'}
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
