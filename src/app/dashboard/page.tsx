import { revalidatePath } from 'next/cache'

import { getPlatforms, savePlatform } from '@/models/Platform'

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
    <>
      <h2 className="text-4xl font-mono">Platforms</h2>
      <div>
        <ul>
          {platforms.map((platform: any) => (
            <li className="text-white" key={platform.id}>
              {platform.name}
            </li>
          ))}
        </ul>
      </div>

      <section className="py-4 font-mono">
        <h2 className="text-2xl ">Add Platform</h2>

        <form action={createPlatform} className="py-2 flex gap-2">
          <input
            className="border-white border-2 bg-transparent p-2 rounded flex-1"
            type="text"
            name="platformName"
            placeholder="Platform name"
          />
          <button className="p-2 border-white border-2 rounded w-auto">
            Submit
          </button>
        </form>
      </section>
    </>
  )
}
