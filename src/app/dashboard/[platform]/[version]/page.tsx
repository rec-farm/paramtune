import { revalidatePath } from 'next/cache'
import { Suspense } from 'react'

import JsonEditable from '@/components/JsonEditable'
import JsonOutput from '@/components/JsonOutput'
import PageTitle from '@/components/PageTitle'
import { getSchema, saveSchema } from '@/models/Schema'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

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
    <div className="space-y-6">
      <PageTitle platform={platform} version={version} />

      <Suspense fallback={<div>Loading...</div>}>
        <form action={updateSchema} className="space-y-4">
          <Card title="Schema">
            <JsonEditable
              title=""
              name="content"
              defaultValue={JSON.stringify(schema?.content, null, 2)}
            />
          </Card>

          <Button type="submit" variant="primary">Save changes</Button>

          <Card title="JSON Output">
            <JsonOutput title="" content={(schema?.output as any) || {}} />
          </Card>
        </form>
      </Suspense>
    </div>
  )
}
