import { Suspense } from 'react'
import { revalidatePath } from 'next/cache'
import PageTitle from '@/components/PageTitle'
import { getPlatform, savePlatform } from '@/models/Platform'

type PageProps = {
  params: {
    platform: string
  }
}

type VersionTagProps = {
  latest: boolean
  version: string
}

const VersionTag = ({ version, latest }: VersionTagProps) => (
  <li className="text-sm bg-blue-900 text-white px-2 p-1 rounded relative font-mono">
    {latest && (
      <div className="w-2 h-2 animate-pulse bg-blue-400 absolute top-0 left-0 rounded-full" />
    )}
    v{version}
  </li>
)

export default async function Page({ params }: PageProps) {
  const platform = await getPlatform(params.platform)

  async function createVersion(formData: FormData) {
    'use server'

    const platform = await getPlatform(params.platform)

    const versionName = formData.get('versionName') as string
    await savePlatform(platform.name, {
      name: platform.name,
      versions: [...(platform.versions || []), versionName],
    })

    revalidatePath('/dashboard/[platform]')
  }

  return (
    <>
      <PageTitle platform={params.platform} />

      <div>
        <Suspense fallback={<div>Loading...</div>}>
          <h2 className="my-2 text-xl font-mono">Versions</h2>

          <ul className="flex gap-1">
            {platform?.versions?.reverse().map((version: string, index) => (
              <VersionTag
                latest={index === 0}
                key={version}
                version={version}
              />
            ))}
          </ul>
        </Suspense>
      </div>

      <section className="py-4 font-mono">
        <h2 className="text-2xl ">Add Version</h2>

        <form action={createVersion} className="py-2 flex gap-2">
          <input
            className="border-white border-2 bg-transparent p-2 rounded flex-1"
            type="text"
            name="versionName"
            placeholder="Version name"
          />
          <button className="p-2 border-white border-2 rounded w-auto">
            Submit
          </button>
        </form>
      </section>
    </>
  )
}
