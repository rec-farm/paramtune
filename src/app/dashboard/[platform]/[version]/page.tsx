import { revalidatePath } from 'next/cache'
import { Suspense } from 'react'
import Link from 'next/link'
import { GitCompare } from 'lucide-react'

import { createHash } from 'crypto'
import { saveSchemaContent } from '@/actions/saveSchema'
import PageTitle from '@/components/PageTitle'
import SchemaTabs from '@/components/SchemaTabs'
import {
  getSchema,
  getSchemaHistoryWithTimestamps,
  InvalidContentError,
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
  const contentHash = createHash('sha256')
    .update(JSON.stringify(schema?.content || {}))
    .digest('hex')
  const shortHash = `${contentHash.slice(0, 8)}`
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
      throw new InvalidContentError()
    }

    await saveSchemaContent(platformName, versionName, content)

    revalidatePath('/dashboard/[platform]/[version]', 'page')
  }

  async function restoreVersion(content: Record<string, unknown>) {
    'use server'

    await saveSchemaContent(platformName, versionName, content)
    revalidatePath('/dashboard/[platform]/[version]', 'page')
  }

  return (
    <div className="space-y-4 mx-auto max-w-5xl">
      <header className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <PageTitle platform={platformName} version={versionName} />
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/dashboard/compare?platformA=${encodeURIComponent(platformName)}&versionA=${encodeURIComponent(versionName)}`}
              className="pt-btn pt-btn-secondary h-10 px-4"
            >
              <GitCompare className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              Compare
            </Link>
          </div>
        </div>
        <p className="text-xs text-meta tabular-nums flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>JSON Schema</span>
          <span aria-hidden="true">·</span>
          <span title={`sha256 ${contentHash}`}>sha256 {shortHash}</span>
          <span aria-hidden="true">·</span>
          <span>
            {history.length} {history.length === 1 ? 'revision' : 'revisions'}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {schema?.dependencies?.length ?? 0}{' '}
            {schema?.dependencies?.length === 1 ? 'dependency' : 'dependencies'}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {history[0]?.timestamp
              ? `Updated ${new Date(history[0].timestamp).toLocaleDateString()}`
              : 'Never saved'}
          </span>
        </p>
      </header>

      <Suspense
        fallback={
          <div className="space-y-4" aria-busy="true">
            <div className="pt-skeleton h-10 w-72" />
            <div className="pt-skeleton h-96 w-full" />
          </div>
        }
      >
        <div className="space-y-4">
          <SchemaTabs
            defaultValue={JSON.stringify(schema?.content || {}, null, 2)}
            updateSchema={updateSchema}
            restoreVersion={restoreVersion}
            history={history}
            currentSchema={schema}
          />
        </div>
      </Suspense>
    </div>
  )
}
