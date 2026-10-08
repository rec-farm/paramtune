import { useRef, useState, type KeyboardEvent } from 'react'
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import NavHeader from '@/components/NavHeader'
import Footer from '@/components/Footer'

type Endpoint = {
  method: 'GET' | 'POST'
  path: string
  description: string
  requestBody?: {
    description: string
    example: string
  }
  responses: {
    status: number
    description: string
    example?: string
  }[]
}

const endpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/schemas',
    description: 'List all platforms with their available versions',
    responses: [
      {
        status: 200,
        description: 'Array of platforms',
        example: '[{ "name": "mobile", "versions": ["1.0.0", "1.1.0"] }]',
      },
    ],
  },
  {
    method: 'GET',
    path: '/api/{platform}',
    description: 'Get details for a specific platform',
    responses: [
      {
        status: 200,
        description: 'Platform object',
        example: '{ "name": "mobile", "versions": ["1.0.0", "1.1.0"] }',
      },
      { status: 404, description: 'Platform not found' },
    ],
  },
  {
    method: 'POST',
    path: '/api/{platform}',
    description: 'Create or update a platform',
    requestBody: {
      description: 'Platform data object',
      example: '{ "name": "mobile", "versions": ["1.0.0"] }',
    },
    responses: [
      { status: 201, description: 'Platform created/updated', example: '{ "ok": true }' },
      { status: 400, description: 'Invalid JSON body' },
    ],
  },
  {
    method: 'GET',
    path: '/api/{platform}/versions',
    description: 'List all versions for a platform',
    responses: [
      {
        status: 200,
        description: 'Array of version strings',
        example: '["1.0.0", "1.1.0", "2.0.0"]',
      },
      { status: 404, description: 'Platform not found' },
    ],
  },
  {
    method: 'POST',
    path: '/api/{platform}/versions',
    description: 'Add a new version to a platform',
    requestBody: {
      description: 'Version to add',
      example: '{ "version": "1.2.0" }',
    },
    responses: [
      { status: 201, description: 'Version added', example: '{ "ok": true }' },
      { status: 400, description: 'Invalid request' },
    ],
  },
  {
    method: 'GET',
    path: '/api/{platform}/{version}',
    description: 'Get the schema content for a specific platform version',
    responses: [
      {
        status: 200,
        description: 'Schema object with content, dependencies, and resolved output',
        example:
          '{ "content": {...}, "dependencies": ["base/1.0.0"], "output": {...} }',
      },
      { status: 404, description: 'Schema not found' },
    ],
  },
]

const guideSteps = [
  {
    title: '1. Create a platform',
    description:
      'Platforms are top-level containers that group related schema versions. Create one by POSTing to the platform endpoint.',
    command: `curl -X POST http://localhost:3000/api/mobile \\
  -H "Content-Type: application/json" \\
  -d '{"name": "mobile", "versions": ["1.0.0"]}'`,
    response: '{ "ok": true }',
  },
  {
    title: '2. Add a version',
    description:
      'Each platform can have multiple versions. Add new versions as your configuration evolves.',
    command: `curl -X POST http://localhost:3000/api/mobile/versions \\
  -H "Content-Type: application/json" \\
  -d '{"version": "1.1.0"}'`,
    response: '{ "ok": true }',
  },
  {
    title: '3. Fetch the resolved schema',
    description:
      'Retrieve the fully resolved schema for a specific version. The response includes the raw content, declared dependencies, and the merged output with all inherited values.',
    command: 'curl http://localhost:3000/api/mobile/1.1.0',
    response: `{
  "content": { "feature": { "enabled": true } },
  "dependencies": ["core/1.0.0"],
  "output": {
    "feature": { "enabled": true },
    "core": { "version": "1.0.0" }
  }
}`,
  },
  {
    title: '4. List everything',
    description:
      'Query all platforms at once or drill into a specific platform to see its available versions.',
    command: 'curl http://localhost:3000/api/schemas',
    response: `[
  { "name": "mobile", "versions": ["1.0.0", "1.1.0"] },
  { "name": "web", "versions": ["2.0.0"] }
]`,
  },
  {
    title: '5. Read from a service',
    description:
      'Create a read-only API token under Dashboard → API tokens, scoped to the platforms a service needs, and send it as a bearer token. Tokens can read but never change configuration.',
    command: `curl http://localhost:3000/api/mobile/1.1.0 \\
  -H "Authorization: Bearer ptk_..."`,
    response: '{ "content": {...}, "dependencies": [...], "output": {...} }',
  },
]

const compositionExamples = [
  {
    title: '@extends directive',
    description:
      'Schemas can inherit from other schemas using @extends. The child schema is deep-merged on top of the parent, so you only need to declare overrides.',
    code: `{
  "@extends": "core/1.0.0",
  "feature": {
    "enabled": true,
    "override": "custom-value"
  }
}`,
  },
  {
    title: 'Version ranges',
    description:
      'Dependencies can use semver ranges to stay up-to-date without pinning to an exact version. Supported syntaxes include caret (^), tilde (~), and comparison operators.',
    code: `// Exact version
"@extends": "core/1.2.3"

// Latest available
"@extends": "core/latest"

// Compatible versions (^, ~, >=)
"@extends": "core/^1.0.0"
"@extends": "core/~1.2.0"
"@extends": "core/>=1.0.0"`,
  },
  {
    title: 'Cascade updates',
    description:
      'When a base schema changes, all schemas that depend on it via @extends are automatically re-resolved. Circular dependencies are detected and rejected at save time.',
    code: `// If "core/1.0.0" is updated, every schema
// that declares '@extends': 'core/1.0.0'
// (or a matching range) is re-processed
// automatically.`,
  },
]

type Tab = 'guide' | 'reference'

const TABS: { id: Tab; label: string }[] = [
  { id: 'guide', label: 'Guide' },
  { id: 'reference', label: 'Reference' },
]

function MethodBadge({ method }: { method: 'GET' | 'POST' }) {
  return (
    <Badge variant={method === 'GET' ? 'secondary' : 'outline'}>
      {method}
    </Badge>
  )
}

function StatusBadge({ status }: { status: number }) {
  const ok = status < 400
  const Icon = ok ? CheckCircle2 : XCircle
  return (
    <Badge variant={ok ? 'success' : 'destructive'} className="tabular-nums">
      <Icon className="w-3 h-3" strokeWidth={1.5} aria-hidden="true" />
      {status}
    </Badge>
  )
}

function StepNumber({ n }: { n: number }) {
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-sm border border-border-strong flex items-center justify-center pt-stat text-sm text-muted-foreground">
      {n}
    </div>
  )
}

function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div>
      {label && <span className="pt-label text-meta mb-1 block">{label}</span>}
      <pre className="pt-code overflow-x-auto">
        {children}
      </pre>
    </div>
  )
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="pt-title-2">{title}</h2>
      <p className="mt-3 max-w-[45ch] text-lg text-muted-foreground">{subtitle}</p>
    </div>
  )
}

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('guide')
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const focusTab = (index: number) => {
    const next = (index + TABS.length) % TABS.length
    setActiveTab(TABS[next].id)
    tabRefs.current[next]?.focus()
  }

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'ArrowRight') focusTab(index + 1)
    else if (event.key === 'ArrowLeft') focusTab(index - 1)
    else if (event.key === 'Home') focusTab(0)
    else if (event.key === 'End') focusTab(TABS.length - 1)
    else return
    event.preventDefault()
  }

  return (
    <>
      <NavHeader />
      {/* Docs use the 16px base (§4) */}
      <main className="max-w-4xl mx-auto px-4 md:px-6 pt-16 pb-16 text-lg">
        <div className="mb-12">
          <p className="pt-eyebrow">Docs</p>
          <h1 className="pt-title-1 mt-2">
            API docs<span className="pt-period">.</span>
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-[45ch]">
            Read and write platform schemas and versions over HTTP.
          </p>
          <a href="/openapi.yaml" className="pt-link-tertiary mt-4">
            View OpenAPI spec
            <ArrowRight className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          </a>
        </div>

        {/* Tab switcher */}
        <div role="tablist" aria-label="Documentation sections" className="flex mb-8 border-b border-border">
          {TABS.map((tab, index) => {
            const selected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[index] = el
                }}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={`h-9 px-4 rounded-t-sm border-b-2 -mb-px text-base transition-colors duration-200 ${
                  selected
                    ? 'border-primary bg-primary-soft text-link font-semibold'
                    : 'border-transparent text-muted-foreground font-medium hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeTab === 'guide' && (
          <div
            role="tabpanel"
            id="panel-guide"
            aria-labelledby="tab-guide"
            className="space-y-12"
          >
            {/* Quick Start */}
            <section>
              <SectionHeading
                title="Quick start"
                subtitle="Go from zero to a resolved schema in four steps."
              />
              <div className="space-y-4">
                {guideSteps.map((step, i) => (
                  <Card key={i}>
                    <div className="flex items-start gap-4">
                      <StepNumber n={i + 1} />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold tracking-[-0.005em] mb-1">
                          {step.title.replace(/^\d+\.\s*/, '')}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 max-w-[68ch]">
                          {step.description}
                        </p>
                        <div className="space-y-2">
                          <CodeBlock label="Request">{step.command}</CodeBlock>
                          <CodeBlock label="Response">{step.response}</CodeBlock>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Schema Composition */}
            <section>
              <SectionHeading
                title="Schema composition"
                subtitle="Inherit, override, and compose schemas across platforms."
              />
              <div className="space-y-4">
                {compositionExamples.map((ex, i) => (
                  <Card key={i}>
                    <h3 className="text-lg font-bold tracking-[-0.005em] mb-1">{ex.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 max-w-[68ch]">
                      {ex.description}
                    </p>
                    <CodeBlock>{ex.code}</CodeBlock>
                  </Card>
                ))}
              </div>
            </section>

            {/* Validation & Errors */}
            <section>
              <SectionHeading
                title="Validation"
                subtitle="What gets checked before a schema is saved."
              />
              <Card>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="text-meta" aria-hidden="true">&#x25B8;</span>
                    <span>Content must be a plain JSON object — arrays, strings, and null are rejected.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-meta" aria-hidden="true">&#x25B8;</span>
                    <span>Every <code className="text-foreground">@extends</code> reference must resolve to an existing platform/version pair.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-meta" aria-hidden="true">&#x25B8;</span>
                    <span>Semver ranges must match at least one published version.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-meta" aria-hidden="true">&#x25B8;</span>
                    <span>Circular dependency chains are detected at any depth and rejected with a clear error message.</span>
                  </li>
                </ul>
              </Card>
            </section>

            {/* Error format */}
            <section>
              <SectionHeading
                title="Error format"
                subtitle="All error responses share a consistent shape."
              />
              <Card>
                <p className="text-sm text-muted-foreground mb-3 max-w-[68ch]">
                  HTTP status codes follow REST conventions: 400 for bad input, 404 for missing resources, and 500 for server failures.
                </p>
                <CodeBlock>{'{ "error": "Error message" }'}</CodeBlock>
              </Card>
            </section>
          </div>
        )}

        {activeTab === 'reference' && (
          <div role="tabpanel" id="panel-reference" aria-labelledby="tab-reference">
            <div className="space-y-4">
              {endpoints.map((endpoint, index) => (
                <Card key={index}>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <MethodBadge method={endpoint.method} />
                    <code className="text-sm bg-surface-2 px-3 py-1 border border-border break-all">
                      {endpoint.path}
                    </code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {endpoint.description}
                  </p>

                  {endpoint.requestBody && (
                    <div className="mb-4">
                      <h4 className="pt-label text-meta mb-2">Request body</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {endpoint.requestBody.description}
                      </p>
                      <CodeBlock>{endpoint.requestBody.example}</CodeBlock>
                    </div>
                  )}

                  <div>
                    <h4 className="pt-label text-meta mb-2">Responses</h4>
                    <div className="space-y-3">
                      {endpoint.responses.map((response, rIndex) => (
                        <div key={rIndex} className="text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <StatusBadge status={response.status} />
                            <span className="text-muted-foreground">
                              {response.description}
                            </span>
                          </div>
                          {response.example && (
                            <CodeBlock>{response.example}</CodeBlock>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="mt-8">
              <h3 className="pt-label mb-3">Error responses</h3>
              <p className="text-sm text-muted-foreground mb-3">
                All endpoints return errors in the following format:
              </p>
              <CodeBlock>{'{ "error": "Error message" }'}</CodeBlock>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
