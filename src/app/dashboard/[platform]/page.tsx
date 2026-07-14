import PageTitle from '@/components/PageTitle'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import {
  getPlatform,
  savePlatform,
  MissingPlatformError,
} from '@/models/Platform'
import { addVersion, isValidVersion } from '@/lib/versionUtils'
import { revalidatePath } from 'next/cache'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

type VersionTagProps = {
  latest: boolean
  version: string
}

const VersionTag = ({ version, latest }: VersionTagProps) => (
  <Badge className="relative">
    {latest && (
      <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
    )}
    v{version}
  </Badge>
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
          title="Platform Not Found"
          subtitle="The platform you're looking for doesn't exist"
        >
          <p className="text-muted-foreground">
            Platform &quot;{platformName}&quot; could not be found. It may have
            been deleted or never existed.
          </p>
        </Card>
      </div>
    )
  }

  async function createVersion(formData: FormData) {
    'use server'

    const resolvedParams = await params
    const platformName = decodeURIComponent(resolvedParams.platform)
    const platform = await getPlatform(platformName)

    if (!platform) {
      throw new MissingPlatformError({ platform: platformName })
    }

    const versionName = formData.get('versionName') as string
    if (!isValidVersion(versionName)) {
      throw new Error(
        `Invalid version "${versionName}": must be a valid semantic version (e.g. 1.2.3)`
      )
    }
    await savePlatform(platform.name, {
      name: platform.name,
      versions: addVersion(platform.versions, versionName),
    })

    revalidatePath(`/dashboard/${encodeURIComponent(platform.name)}`)
  }

  return (
    <div className="space-y-6">
      <PageTitle platform={platformName} />

      <Card title="Versions">
        <Suspense fallback={<div>Loading...</div>}>
          <ul className="flex flex-wrap gap-2">
            {platform?.versions
              ?.slice()
              .reverse()
              .map((version: string, index) => (
                <li key={version}>
                  <VersionTag latest={index === 0} version={version} />
                </li>
              ))}
          </ul>
        </Suspense>
      </Card>

      <Card title="Add Version">
        <form action={createVersion} className="flex gap-2">
          <Input type="text" name="versionName" placeholder="Version name" />
          <Button type="submit" variant="primary">
            Create
          </Button>
        </form>
      </Card>
    </div>
  )
}
