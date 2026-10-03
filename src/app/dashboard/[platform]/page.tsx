import PageTitle from '@/components/PageTitle'
import AddVersionForm from '@/components/AddVersionForm'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import Card from '@/components/ui/Card'
import EmptyState from '@/components/EmptyState'
import { getPlatform } from '@/models/Platform'
import { sortVersionsDescending } from '@/lib/versionUtils'
import { createPlatformVersion } from '@/actions/createVersion'
import { revalidatePath } from 'next/cache'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

type VersionTagProps = {
  latest: boolean
  version: { platform: string; name: string }
}

const VersionTag = ({ version, latest }: VersionTagProps) => (
  <Link
    href={`/dashboard/${encodeURIComponent(version.platform)}/${encodeURIComponent(version.name)}`}
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

export default async function Page({
  params,
}: {
  params: Promise<{ platform: string }>
}) {
  const resolvedParams = await params
  const platformName = decodeURIComponent(resolvedParams.platform)
  const platform = await getPlatform(platformName)

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
            <Link href="/dashboard" className="pt-btn pt-btn-secondary">
              Back to overview
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  async function createVersion(formData: FormData) {
    'use server'

    const resolvedParams = await params
    const platformName = decodeURIComponent(resolvedParams.platform)
    const versionName = formData.get('versionName') as string

    await createPlatformVersion(platformName, versionName)

    revalidatePath(`/dashboard/${encodeURIComponent(platformName)}`)
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
                // eslint-disable-next-line @next/next/no-img-element -- static SVG illustration
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
