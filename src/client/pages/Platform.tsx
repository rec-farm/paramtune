import { useLoaderData, useRevalidator } from 'react-router'
import { api, UI_API } from '@/client/api'
import type { Platform } from '@/shared/contracts'
import PageTitle from '@/components/PageTitle'
import AddVersionForm from '@/components/AddVersionForm'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/EmptyState'
import { sortVersionsDescending } from '@/lib/versionUtils'
import { Suspense } from 'react'


type VersionTagProps = {
  latest: boolean
  version: { platform: string; name: string }
}

const VersionTag = ({ version, latest }: VersionTagProps) => (
  <Link
    to={`/dashboard/${encodeURIComponent(version.platform)}/${encodeURIComponent(version.name)}`}
    className={cn(
      'inline-flex items-center gap-2 h-8 px-3 rounded-sm border font-mono text-sm tabular-nums transition-colors duration-150 hover:border-border-strong',
      latest
        ? 'border-border-strong bg-surface-2 text-foreground'
        : 'border-border bg-surface-2 text-muted-foreground hover:text-foreground'
    )}
  >
    v{version.name}
    {latest && (
      <span className="inline-flex items-center h-[18px] px-1 rounded-xs bg-accent-tile text-accent-text text-[11px] font-semibold">
        latest
      </span>
    )}
  </Link>
)

export default function PlatformPage() {
  const platform = useLoaderData() as Platform
  const platformName = platform.name
  const revalidator = useRevalidator()

  if (!platform) {
    return (
      <div className="space-y-6">
        <PageTitle platform={platformName} />
        <Card
          title="We couldn't find that platform"
          subtitle="It may have been deleted, or the link has a typo."
        >
          <div className="space-y-4">
            <p className="text-muted-foreground">
              No platform named{' '}
              <code className="pt-kbd text-foreground">{platformName}</code>{' '}
              exists in this workspace.
            </p>
            <Link to="/dashboard" className="pt-btn pt-btn-secondary">
              Back to overview
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  async function createVersion(formData: FormData) {
    await api(`${UI_API}/platforms/${encodeURIComponent(platformName)}/versions`, {
      method: 'POST', body: JSON.stringify({ version: formData.get('versionName') }),
    })
    await revalidator.revalidate()
  }

  return (
    <div className="space-y-8">
      <PageTitle platform={platformName} />

      <Card title="Versions">
        <Suspense
          fallback={
            <div className="flex flex-wrap gap-2" aria-busy="true">
              <div className="pt-skeleton h-8 w-24" />
              <div className="pt-skeleton h-8 w-24" />
              <div className="pt-skeleton h-8 w-24" />
            </div>
          }
        >
          {(platform.versions ?? []).length === 0 ? (
            <EmptyState
              visual={
                <img
                  src="/brand/empty-state-paramtune-dark.svg"
                  alt=""
                  width={200}
                  height={120}
                />
              }
              title="Add your first version"
              description="Each version holds its own schema. Start fresh, or build on another with @extends."
              action={
                <a href="#add-version" className="pt-link-tertiary">
                  Add version <span aria-hidden="true">→</span>
                </a>
              }
            />
          ) : (
            <ul className="flex flex-wrap gap-2">
              {sortVersionsDescending(platform.versions ?? []).map(
                (version: string, index) => (
                  <li key={version}>
                    <VersionTag
                      latest={index === 0}
                      version={{ platform: platformName, name: version }}
                    />
                  </li>
                )
              )}
            </ul>
          )}
        </Suspense>
      </Card>

      <Card id="add-version" title="Add a version">
        <AddVersionForm action={createVersion} />
      </Card>
    </div>
  )
}
