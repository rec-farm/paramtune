import { revalidatePath } from 'next/cache'
import { Suspense } from 'react'

import JsonEditable from '@/components/JsonEditable'
import JsonOutput from '@/components/JsonOutput'
import PageTitle from '@/components/PageTitle'
import { getSchema, saveSchema } from '@/models/Schema'

export const dynamic = 'force-dynamic'

export default async function Page({ params }: { params: any }) {
  const { platform, version } = params as { platform: string; version: string }
  const schema = await getSchema(platform, version)

  async function updateSchema(formData: FormData) {
    'use server'

    const content = JSON.parse(formData.get('content') as string)
    await saveSchema(platform, version, content)

    revalidatePath('/dashboard/[platform]/[version]', 'page')
  }

  return (
    <>
      <PageTitle platform={platform} version={version} />

      <Suspense fallback={<div>Loading...</div>}>
        <form action={updateSchema}>
          <div className="py-6">
            <JsonEditable
              title="Schema"
              name="content"
              defaultValue={JSON.stringify(schema?.content, null, 2)}
            />
          </div>

          <button className="p-2 border-white border-2 rounded w-auto">
            Submit
          </button>

          <div className="py-6">
            <JsonOutput title="Json Output" content={schema?.output || ''} />
          </div>
        </form>
      </Suspense>
    </>
  )
}
