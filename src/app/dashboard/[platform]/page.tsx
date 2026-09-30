import PageTitle from '@/components/PageTitle'
import AddVersionForm from '@/components/AddVersionForm'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import Card from '@/components/ui/Card'
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
      'inline-flex items-center gap-2 h-8 px-3 border text-sm normal-case tabular-nums transition-colors duration-150 hover:bg-surface-2',
      latest ? 'border-primary text-foreground' : 'border-border-strong text-muted-foreground'
    )}
  >
    v{version.name}
    {latest && <span className="pt-label text-meta">latest</span>}
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
          title="Platform not found"
          subtitle="The platform you're looking for doesn't exist"
        >
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Platform &quot;{platformName}&quot; could not be found. It may
              have been deleted or never existed.
            </p>
            <Link href="/dashboard" className="pt-btn pt-btn-secondary">
              Back to platforms
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
    <div className="space-y-6">
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
            <p className="text-sm text-muted-foreground">
              This platform has no versions yet. Add one below to start
              editing its schema.
            </p>
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

      <Card title="Add version">
        <AddVersionForm action={createVersion} />
      </Card>
    </div>
  )
}
