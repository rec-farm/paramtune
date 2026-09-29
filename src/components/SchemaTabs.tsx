'use client'

import { useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import dynamic from 'next/dynamic'
import Card from '@/components/ui/Card'
import type { Schema, SchemaHistoryEntry } from '@/models/Schema'

const SchemaEditorForm = dynamic(
  () => import('@/components/SchemaEditorForm'),
  {
    ssr: false,
    loading: () => <div className="pt-skeleton min-h-64" />,
  }
)

const SchemaHistory = dynamic(() => import('@/components/SchemaHistory'), {
  ssr: false,
  loading: () => <div className="pt-skeleton min-h-64" />,
})

const JsonOutput = dynamic(() => import('@/components/JsonOutput'), {
  ssr: false,
  loading: () => <div className="pt-skeleton min-h-64" />,
})

type SchemaTabsProps = {
  defaultValue: string
  updateSchema: (formData: FormData) => Promise<void>
  restoreVersion: (content: Record<string, unknown>) => Promise<void>
  history: Array<SchemaHistoryEntry & { timestamp: number }>
  currentSchema?: Schema | Record<string, never>
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
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const historyCount = history?.length ?? 0
  const previewCount = useMemo(
    () => Object.keys(currentSchema?.output || {}).length,
    [currentSchema]
  )

  const focusTab = (index: number) => {
    const next = (index + TABS.length) % TABS.length
    setActive(TABS[next])
    tabRefs.current[next]?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault()
        focusTab(index + 1)
        break
      case 'ArrowLeft':
        event.preventDefault()
        focusTab(index - 1)
        break
      case 'Home':
        event.preventDefault()
        focusTab(0)
        break
      case 'End':
        event.preventDefault()
        focusTab(TABS.length - 1)
        break
    }
  }

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div role="tablist" aria-label="Schema views" className="flex items-center gap-6">
          {TABS.map((tab, index) => {
            const isActive = active === tab
            const count =
              tab === 'History'
                ? historyCount
                : tab === 'Preview'
                ? previewCount
                : undefined
            return (
              <button
                key={tab}
                ref={(el) => {
                  tabRefs.current[index] = el
                }}
                type="button"
                role="tab"
                id={`schema-tab-${tab}`}
                aria-selected={isActive}
                aria-controls={`schema-panel-${tab}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActive(tab)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                className={`pt-label relative flex items-center gap-2 h-10 -mb-px border-b-2 transition-colors duration-200 ${
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <span>{tab}</span>
                {typeof count === 'number' && (
                  <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 border border-border-strong text-xs font-normal tabular-nums text-muted-foreground">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {active === 'Editor' && (
        <div role="tabpanel" id="schema-panel-Editor" aria-labelledby="schema-tab-Editor" className="space-y-3">
          <SchemaEditorForm
            defaultValue={defaultValue}
            updateSchema={updateSchema}
          />
        </div>
      )}

      {active === 'Preview' && (
        <div role="tabpanel" id="schema-panel-Preview" aria-labelledby="schema-tab-Preview" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card
            title="Live preview"
            subtitle="See how your configuration will be consumed"
                        className="p-4"
          >
            <JsonOutput
              title=""
              content={currentSchema?.output || {}}
            />
          </Card>
          <Card title="Config guide" className="p-4">
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="pt-label mb-2">@extends Directive</h4>
                <p className="text-muted-foreground mb-2">
                  Use{' '}
                  <code className="text-xs bg-surface-2 border border-border px-1 font-mono text-foreground">
                    @extends
                  </code>{' '}
                  to inherit configuration from other schemas:
                </p>
                <pre className="bg-surface border border-border p-3 font-mono text-xs">{`{
  "@extends": "ios/1.0.0",
  "customProperty": "value"
}`}</pre>
              </div>

              <div>
                <h4 className="pt-label mb-2">Version References</h4>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li>
                    <code className="text-xs bg-surface-2 border border-border px-1 font-mono text-foreground">
                      platform/version
                    </code>{' '}
                    - Exact version
                  </li>
                  <li>
                    <code className="text-xs bg-surface-2 border border-border px-1 font-mono text-foreground">
                      platform/latest
                    </code>{' '}
                    - Latest version
                  </li>
                  <li>
                    <code className="text-xs bg-surface-2 border border-border px-1 font-mono text-foreground">
                      platform/^1.0.0
                    </code>{' '}
                    - Version range
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="pt-label mb-2">Best Practices</h4>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li>
                    Start with an empty object{' '}
                    <code className="text-xs bg-surface-2 border border-border px-1 font-mono text-foreground">{`{}`}</code>
                  </li>
                  <li>Use @extends to inherit base configurations</li>
                  <li>Override specific properties as needed</li>
                  <li>Validate before saving</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )}

      {active === 'History' && (
        <div role="tabpanel" id="schema-panel-History" aria-labelledby="schema-tab-History" className="space-y-4">
          <SchemaHistory
            history={history}
            onRestore={restoreVersion}
          />
        </div>
      )}
    </div>
  )
}
