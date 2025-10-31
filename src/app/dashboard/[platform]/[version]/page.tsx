import { revalidatePath } from 'next/cache'
import { Suspense } from 'react'

import PageTitle from '@/components/PageTitle'
import SchemaTabs from '@/components/SchemaTabs'
import Badge from '@/components/ui/Badge'
import {
  getSchema,
  saveSchema,
  getSchemaHistoryWithTimestamps,
} from '@/models/Schema'

export const dynamic = 'force-dynamic'

export default async function Page({
  params,
}: {
  params: Promise<{ platform: string; version: string }>
}) {
  const resolvedParams = await params
  const { platform, version } = resolvedParams
  const platformName = decodeURIComponent(platform)
  const versionName = decodeURIComponent(version)
  const schema = await getSchema(platformName, versionName)
  const history = await getSchemaHistoryWithTimestamps(
    platformName,
    versionName
  )

  async function updateSchema(formData: FormData) {
    'use server'

    const content = JSON.parse(formData.get('content') as string)
    await saveSchema(platformName, versionName, content)

    revalidatePath('/dashboard/[platform]/[version]', 'page')
  }

  return (
    <div className="space-y-4 mx-auto max-w-5xl px-2 md:px-0">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <PageTitle platform={platformName} version={versionName} />
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              JSON Schema
            </Badge>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {history.length} versions •{' '}
          {(schema as any)?.dependencies?.length ?? 0} deps •{' '}
          {history[0]?.timestamp
            ? new Date(history[0].timestamp).toLocaleDateString()
            : '—'}
        </div>
      </header>

      <Suspense fallback={<div>Loading...</div>}>
        <div className="space-y-4">
          <SchemaTabs
            defaultValue={JSON.stringify(schema?.content || {}, null, 2)}
            updateSchema={updateSchema}
            history={history as any}
            currentSchema={schema as any}
          />
        </div>
      </Suspense>
    </div>
  )
}
