import { revalidatePath } from 'next/cache'

import { getPlatforms, savePlatform } from '@/models/Platform'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const platforms = await getPlatforms()

  async function createPlatform(formData: FormData) {
    'use server'

    const platformName = formData.get('platformName') as string
    await savePlatform(platformName, {
      name: platformName,
      versions: [],
    })

    revalidatePath('/dashboard')
  }

  return (
    <div className="space-y-6">
      <Card title="Platforms">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {platforms.map((platform: any) => (
            <li key={platform.id} className="card p-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{platform.name}</div>
                <Link className="btn btn-ghost h-8 px-3" href={`/dashboard/${platform.name}`}>
                  Open
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card title="Add Platform">
        <form action={createPlatform} className="flex gap-2">
          <Input type="text" name="platformName" placeholder="Platform name" />
          <Button type="submit" variant="primary">Create</Button>
        </form>
      </Card>
    </div>
  )
}
