import { useLoaderData, useRevalidator } from 'react-router'
import { api, UI_API } from '@/client/api'
import type { Overview, Platform } from '@/shared/contracts'
import Card from '@/components/ui/Card'
import CreatePlatformForm from '@/components/CreatePlatformForm'
import { getLatestVersion } from '@/lib/versionUtils'
import StatTiles from '@/components/StatTiles'
import EmptyState from '@/components/EmptyState'
import { Link } from 'react-router'
import {
  ChevronRight,
  CircleAlert,
  CircleCheck,
  CircleDashed,
  GitBranch,
  Layers,
} from 'lucide-react'


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

export default function OverviewPage() {
  const { platforms, statuses, failed } = useLoaderData() as Overview
  const revalidator = useRevalidator()
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
    await api(`${UI_API}/platforms`, {
      method: 'POST', body: JSON.stringify({ name: formData.get('platformName') }),
    })
    await revalidator.revalidate()
  }

  return (
    <div className="space-y-8">
      {/* Header trio (§4): eyebrow → 8px → title → 12px → subtitle, art top-right */}
      <header className="flex items-start justify-between gap-8 pt-4 md:pt-8 md:mb-4">
        <div className="min-w-0">
          <p className="pt-eyebrow">Your configs, at a glance</p>
          <h1 className="pt-title-1 mt-2">
            Overview<span className="pt-period">.</span>
          </h1>
          <p className="mt-3 max-w-[45ch] text-lg text-muted-foreground">
            Every platform, version and schema, tuned in one place.
          </p>
        </div>

        <img
          src="/brand/header-paramtune-dark.svg"
          alt=""
          width={240}
          height={148}
          className="hidden md:block shrink-0"
        />
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
          <p role="alert" className="flex items-center gap-2 text-sm text-danger">
            <CircleAlert className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            <span>
              We couldn&apos;t read {failed} {failed === 1 ? 'version' : 'versions'}{' '}
              from Redis, so the counts above are incomplete.{' '}
              <Link to="/dashboard" prefetch="none" className="underline">
                Retry
              </Link>
            </span>
          </p>
        ) : (
          lastSaved?.savedAt && (
            <p className="text-sm text-muted-foreground">
              Last saved{' '}
              <time
                dateTime={new Date(lastSaved.savedAt).toISOString()}
                title={new Date(lastSaved.savedAt).toISOString()}
                className="font-mono font-medium text-foreground"
              >
                {formatRelative(lastSaved.savedAt)}
              </time>{' '}
              ·{' '}
              <Link
                to={`/dashboard/${encodeURIComponent(lastSaved.platform)}/${encodeURIComponent(lastSaved.version)}`}
                className="font-mono font-medium text-foreground underline-offset-4 hover:underline"
              >
                {lastSaved.platform} v{lastSaved.version}
              </Link>
              {lastSaved.author && <> · {lastSaved.author}</>}
            </p>
          )
        )}
      </section>

      <section aria-labelledby="platforms-heading" className="space-y-4 pt-2">
        <div className="flex items-center gap-3">
          <h2 id="platforms-heading" className="pt-heading">
            All platforms
          </h2>
          <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-xs bg-surface-3 font-mono text-[11px] font-semibold tabular-nums text-foreground">
            {platforms.length}
          </span>
        </div>

        {platforms.length === 0 ? (
          <div className="pt-card">
            <EmptyState
              visual={
                <img
                  src="/brand/empty-state-paramtune-dark.svg"
                  alt=""
                  width={200}
                  height={120}
                />
              }
              title="Tune your first platform"
              description="A platform holds the versions and schemas for one app or service."
              action={
                <a href="#create-platform" className="pt-link-tertiary">
                  Create platform <span aria-hidden="true">→</span>
                </a>
              }
            />
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform: Platform) => {
              const latestVersion = getLatestVersion(platform.versions)
              const href = `/dashboard/${encodeURIComponent(platform.name)}`
              const platformVersions = platform.versions?.length || 0
              return (
                <li key={platform.name}>
                  {/* Item card (§8): surface-2, padding 16, mono title, chevron nudges right */}
                  <Link
                    to={href}
                    className="group flex h-full flex-col justify-between gap-4 rounded-sm border border-border bg-surface-2 paper:bg-surface p-4 transition-colors duration-150 hover:border-border-strong"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <h3 className="font-mono text-lg font-medium truncate">
                          {platform.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-mono font-medium text-foreground tabular-nums">
                            {platformVersions}
                          </span>{' '}
                          {platformVersions === 1 ? 'version' : 'versions'}
                          {latestVersion && (
                            <>
                              {' · latest '}
                              <span className="font-mono font-medium text-foreground">
                                v{latestVersion}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5"
                        strokeWidth={1.5}
                        aria-hidden="true"
                      />
                    </div>
                    <span className="pt-label text-muted-foreground group-hover:text-foreground transition-colors duration-150">
                      Open configs <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Card
        id="create-platform"
        title="Create a platform"
        subtitle="Name it after the app or service it configures."
      >
        <CreatePlatformForm action={createPlatform} />
      </Card>
    </div>
  )
}
