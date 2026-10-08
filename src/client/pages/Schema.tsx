import { useLoaderData, useNavigate, useParams, useRevalidator, useRouteLoaderData } from 'react-router'
import { api, schemaPath, UI_API } from '@/client/api'
import DeleteZone from '@/components/DeleteZone'
import PlatformReadOnly, { canWritePlatform } from '@/components/PlatformReadOnly'
import type { SchemaDetail } from '@/shared/contracts'
import { Suspense } from 'react'
import { Link } from 'react-router'
import { GitCompare } from 'lucide-react'

import PageTitle from '@/components/PageTitle'
import SetupGuide from '@/components/SetupGuide'
import type { DashboardData } from '@/client/router'
import SchemaTabs from '@/components/SchemaTabs'


export default function SchemaPage() {
  const { platform: platformName = '', version: versionName = '' } = useParams()
  const { schema, history, contentHash } = useLoaderData() as SchemaDetail
  const dashboard = useRouteLoaderData('dashboard') as DashboardData
  const kind = dashboard.platforms.find((platform) => platform.name === platformName)?.kind
  const shortHash = contentHash.slice(0, 8)
  const revalidator = useRevalidator()
  const navigate = useNavigate()

  async function restoreVersion(content: Record<string, unknown>) {
    await api(schemaPath(platformName, versionName), { method: 'PUT', body: JSON.stringify({ content }) })
    await revalidator.revalidate()
  }

  async function updateSchema(formData: FormData) {
    await restoreVersion(JSON.parse(String(formData.get('content'))))
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <PageTitle platform={platformName} version={versionName} kind={kind} />
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/dashboard/compare?platformA=${encodeURIComponent(platformName)}&versionA=${encodeURIComponent(versionName)}`}
              className="pt-btn pt-btn-secondary"
            >
              <GitCompare className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              Compare
            </Link>
          </div>
        </div>
        {/* Meta line (§4): mono values at weight 500 inside muted sans */}
        <p className="text-sm text-muted-foreground tabular-nums flex flex-wrap items-center gap-x-2 gap-y-1">
          <span>JSON configuration</span>
          <span aria-hidden="true">·</span>
          <span title={`sha256 ${contentHash}`}>
            sha256{' '}
            <span className="font-mono font-medium text-foreground">{shortHash}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <span className="font-mono font-medium text-foreground">{history.length}</span>{' '}
            {history.length === 1 ? 'revision' : 'revisions'}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            <span className="font-mono font-medium text-foreground">
              {schema?.dependencies?.length ?? 0}
            </span>{' '}
            {schema?.dependencies?.length === 1 ? 'dependency' : 'dependencies'}
          </span>
          <span aria-hidden="true">·</span>
          <span>
            {history[0]?.timestamp ? (
              <>
                Updated{' '}
                <time
                  dateTime={new Date(history[0].timestamp).toISOString()}
                  title={new Date(history[0].timestamp).toISOString()}
                  className="font-mono font-medium text-foreground"
                >
                  {new Date(history[0].timestamp).toISOString().slice(0, 10)}
                </time>
              </>
            ) : (
              'Never saved'
            )}
          </span>
        </p>
      </header>

      {dashboard.permissions.write && !canWritePlatform(dashboard.permissions, platformName) && <PlatformReadOnly platform={platformName} />}
      {history.length === 0 && <SetupGuide step={2} />}

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
            key={`${platformName}/${versionName}`}
            defaultValue={JSON.stringify(schema?.content || {}, null, 2)}
            updateSchema={updateSchema}
            restoreVersion={restoreVersion}
            history={history}
            currentSchema={schema}
          />
        </div>
      </Suspense>

      {dashboard.permissions.manage && (
        <DeleteZone
          noun="version"
          confirmName={versionName}
          description={`Removes ${platformName} ${versionName} and its ${history.length === 1 ? 'revision' : `${history.length} revisions`}. Schemas on other platforms that extend it must drop that reference first. This can't be undone.`}
          onDelete={async () => {
            await api(`${UI_API}/platforms/${encodeURIComponent(platformName)}/versions/${encodeURIComponent(versionName)}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
            await navigate(`/dashboard/${encodeURIComponent(platformName)}`)
            // Refresh the sidebar's platform list, which plain navigation keeps.
            await revalidator.revalidate()
          }}
        />
      )}
    </div>
  )
}
