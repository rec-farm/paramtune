import { revalidatePath } from 'next/cache'
import { Suspense } from 'react'
import Link from 'next/link'
import { headers } from 'next/headers'
import { GitCompare } from 'lucide-react'

import { createHash } from 'crypto'
import { auth } from '@/lib/auth'
import PageTitle from '@/components/PageTitle'
import SchemaTabs from '@/components/SchemaTabs'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import {
  getSchema,
  saveSchema,
  getSchemaHistoryWithTimestamps,
  InvalidContentError,
  type Author,
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

  const session = await auth.api.getSession({
    headers: await headers()
  })
  const user = session?.user

  const schema = await getSchema(platformName, versionName)
  const contentHash = createHash('sha256')
    .update(JSON.stringify(schema?.content || {}))
    .digest('hex')
  const shortHash = `0x${contentHash.slice(0, 3).toUpperCase()}...${contentHash.slice(-3).toUpperCase()}`
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

    // Build author from captured user context
    const author: Author | undefined = user
      ? { id: user.id, name: user.name || 'Unknown', image: user.image || undefined }
      : undefined

    await saveSchema(platformName, versionName, content, author)

    revalidatePath('/dashboard/[platform]/[version]', 'page')
  }

  async function restoreVersion(content: Record<string, unknown>) {
    'use server'

    const author: Author | undefined = user
      ? { id: user.id, name: user.name || 'Unknown', image: user.image || undefined }
      : undefined

    await saveSchema(platformName, versionName, content, author)
    revalidatePath('/dashboard/[platform]/[version]', 'page')
  }

  return (
    <div className="space-y-4 mx-auto max-w-5xl px-2 md:px-0">
      <header className="space-y-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <PageTitle platform={platformName} version={versionName} />
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/dashboard/compare?platformA=${encodeURIComponent(platformName)}&versionA=${encodeURIComponent(versionName)}`}
            >
              <Button variant="outline" size="sm" className="gap-1.5 h-10 sm:h-8">
                <GitCompare className="h-3.5 w-3.5" />
                Compare
              </Button>
            </Link>
            <Badge variant="secondary" className="text-xs">
              JSON Schema
            </Badge>
          </div>
        </div>
        <div className="text-[10px] text-gray-500 font-fragmented uppercase tracking-wider flex items-center gap-3">
          <span>HASH: {shortHash}</span>
          <span className="w-1 h-1 bg-primary/40 rounded-full" />
          <span>{history.length} {history.length === 1 ? 'version' : 'versions'}</span>
          <span className="w-1 h-1 bg-primary/40 rounded-full" />
          <span>{schema?.dependencies?.length ?? 0} {schema?.dependencies?.length === 1 ? 'dep' : 'deps'}</span>
          <span className="w-1 h-1 bg-primary/40 rounded-full" />
          <span>{history[0]?.timestamp
            ? new Date(history[0].timestamp).toLocaleDateString()
            : '—'}</span>
        </div>
      </header>

      <Suspense fallback={<div>Loading...</div>}>
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
