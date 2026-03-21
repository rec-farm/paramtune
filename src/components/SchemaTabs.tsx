'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

const SchemaEditorForm = dynamic(
  () => import('@/components/SchemaEditorForm'),
  {
    ssr: false,
    loading: () => <div className="p-4 text-muted-foreground">Loading...</div>,
  }
)

const SchemaHistory = dynamic(() => import('@/components/SchemaHistory'), {
  ssr: false,
  loading: () => <div className="p-4 text-muted-foreground">Loading...</div>,
})

const JsonOutput = dynamic(() => import('@/components/JsonOutput'), {
  ssr: false,
  loading: () => <div className="p-4 text-muted-foreground">Loading...</div>,
})

type SchemaTabsProps = {
  defaultValue: string
  updateSchema: (formData: FormData) => Promise<void>
  restoreVersion: (content: Record<string, unknown>) => Promise<void>
  history: Array<{
    timestamp: number
    content: Record<string, unknown>
    dependencies: string[]
  }>
  currentSchema?: {
    content: Record<string, unknown>
    output?: Record<string, unknown>
  }
}

const TABS = ['Editor', 'Preview', 'History'] as const
type TabKey = (typeof TABS)[number]

export default function SchemaTabs({
  defaultValue,
  updateSchema,
  restoreVersion,
  history,
  currentSchema,
}: SchemaTabsProps) {
  const [active, setActive] = useState<TabKey>('Editor')
  const historyCount = history?.length ?? 0
  const previewCount = useMemo(
    () => Object.keys((currentSchema?.output as any) || {}).length,
    [currentSchema]
  )

  return (
    <div className="space-y-3">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-1 px-0.5">
          {TABS.map((tab) => {
            const isActive = active === tab
            const label = tab
            const count =
              tab === 'History'
                ? historyCount
                : tab === 'Preview'
                ? previewCount
                : undefined
            return (
              <Button
                key={tab}
                variant={isActive ? 'primary' : 'outline'}
                size="sm"
                className={
                  isActive
                    ? 'h-10 sm:h-8 text-xs'
                    : 'text-muted-foreground h-10 sm:h-8 text-xs'
                }
                onClick={() => setActive(tab)}
              >
                <span className="flex items-center gap-2">
                  <span>{label}</span>
                  {typeof count === 'number' && (
                    <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 border border-primary/30 bg-black/50 text-xs font-mono text-muted-foreground">
                      {count}
                    </span>
                  )}
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      {active === 'Editor' && (
        <div className="space-y-3">
          <SchemaEditorForm
            defaultValue={defaultValue}
            updateSchema={updateSchema}
          />
        </div>
      )}

      {active === 'Preview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card
            title="LIVE_PREVIEW"
            subtitle="See how your configuration will be consumed"
            variant="elevated"
            className="p-4"
          >
            <JsonOutput
              title=""
              content={(currentSchema?.output as any) || {}}
            />
          </Card>
          <Card title="CONFIG_GUIDE" className="p-4">
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">@extends Directive</h4>
                <p className="text-muted-foreground mb-2">
                  Use{' '}
                  <code className="text-xs bg-black/50 border border-primary/30 px-1 py-0.5 font-mono">
                    @extends
                  </code>{' '}
                  to inherit configuration from other schemas:
                </p>
                <div className="bg-black/50 border border-primary/30 p-3 font-mono text-xs">{`{
  "@extends": "ios/1.0.0",
  "customProperty": "value"
}`}</div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Version References</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>
                    •{' '}
                    <code className="text-xs bg-black/50 border border-primary/30 px-1 py-0.5 font-mono">
                      platform/version
                    </code>{' '}
                    - Exact version
                  </li>
                  <li>
                    •{' '}
                    <code className="text-xs bg-black/50 border border-primary/30 px-1 py-0.5 font-mono">
                      platform/latest
                    </code>{' '}
                    - Latest version
                  </li>
                  <li>
                    •{' '}
                    <code className="text-xs bg-black/50 border border-primary/30 px-1 py-0.5 font-mono">
                      platform/^1.0.0
                    </code>{' '}
                    - Version range
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Best Practices</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>
                    • Start with an empty object{' '}
                    <code className="text-xs bg-black/50 border border-primary/30 px-1 py-0.5 font-mono">{`{}`}</code>
                  </li>
                  <li>• Use @extends to inherit base configurations</li>
                  <li>• Override specific properties as needed</li>
                  <li>• Validate before saving</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}

      {active === 'History' && (
        <div className="space-y-4">
          <SchemaHistory
            history={history as any}
            currentSchema={currentSchema as any}
            onRestore={restoreVersion}
          />
        </div>
      )}
    </div>
  )
}
