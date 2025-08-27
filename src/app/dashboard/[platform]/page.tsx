import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import PageTitle from '@/components/PageTitle'
import { getPlatform, savePlatform } from '@/models/Platform'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export const dynamic = 'force-dynamic'


type VersionTagProps = {
  latest: boolean
  version: string
}

const VersionTag = ({ version, latest }: VersionTagProps) => (
  <li>
    <Badge className="relative">
      {latest && (
        <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
      )}
      v{version}
    </Badge>
  </li>
)

export default async function Page({ params }: { params: any }) {
  const platform = await getPlatform((params as { platform: string }).platform)

  async function createVersion(formData: FormData) {
    'use server'

    const platform = await getPlatform((params as { platform: string }).platform)
    if (!platform) {
      throw new Error('Platform not found')
    }

    const versionName = formData.get('versionName') as string
    await savePlatform(platform.name, {
      name: platform.name,
      versions: [...(platform.versions || []), versionName],
    })

    revalidatePath('/dashboard/[platform]')
  }

  return (
    <div className="space-y-6">
      <PageTitle platform={(params as { platform: string }).platform} />

      <Card title="Versions">
        <Suspense fallback={<div>Loading...</div>}>
          <ul className="flex flex-wrap gap-2">
            {platform?.versions?.slice().reverse().map((version: string, index) => (
              <VersionTag latest={index === 0} key={version} version={version} />
            ))}
          </ul>
        </Suspense>
      </Card>

      <Card title="Add Version">
        <form action={createVersion} className="flex gap-2">
          <Input type="text" name="versionName" placeholder="Version name" />
          <Button type="submit" variant="primary">Create</Button>
        </form>
      </Card>
    </div>
  )
}
