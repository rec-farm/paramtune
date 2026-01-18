import { revalidatePath } from 'next/cache'
import { Suspense } from 'react'
import Link from 'next/link'
import { GitCompare } from 'lucide-react'

import PageTitle from '@/components/PageTitle'
import SchemaTabs from '@/components/SchemaTabs'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
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

    let content: Record<string, unknown>
    try {
      content = JSON.parse(formData.get('content') as string) as Record<
        string,
        unknown
      >
    } catch {
      throw new Error('Invalid JSON content')
    }

    await saveSchema(platformName, versionName, content)

    revalidatePath('/dashboard/[platform]/[version]', 'page')
  }

  return (
    <div className="space-y-4 mx-auto max-w-5xl px-2 md:px-0">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <PageTitle platform={platformName} version={versionName} />
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/compare?platformA=${encodeURIComponent(platformName)}&versionA=${encodeURIComponent(versionName)}`}
            >
              <Button variant="outline" size="sm" className="gap-1.5">
                <GitCompare className="h-3.5 w-3.5" />
                Compare
              </Button>
            </Link>
            <Badge variant="secondary" className="text-xs">
              JSON Schema
            </Badge>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {history.length} {history.length === 1 ? 'version' : 'versions'} •{' '}
          {(schema as any)?.dependencies?.length ?? 0} {(schema as any)?.dependencies?.length === 1 ? 'dep' : 'deps'} •{' '}
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
