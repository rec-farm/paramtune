'use client'

import { useState } from 'react'
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

function MethodBadge({ method }: { method: 'GET' | 'POST' }) {
  return (
    <Badge variant={method === 'GET' ? 'secondary' : 'success'}>
      {method}
    </Badge>
  )
}

function StepNumber({ n }: { n: number }) {
  return (
    <div className="flex-shrink-0 w-8 h-8 border border-primary/40 bg-primary/10 flex items-center justify-center text-xs font-display font-bold text-primary">
      {n}
    </div>
  )
}

function CodeBlock({ children, label }: { children: string; label?: string }) {
  return (
    <div>
      {label && (
        <span className="text-[10px] font-display font-bold uppercase tracking-widest text-primary/60 mb-1 block">
          {label}
        </span>
      )}
      <pre className="text-xs bg-black/60 border border-primary/20 p-3 overflow-x-auto font-fragmented leading-relaxed">
        {children}
      </pre>
    </div>
  )
}

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('guide')

  return (
    <>
      <NavHeader />
      <div className="max-w-4xl mx-auto py-8 px-6 pt-32 bg-grid-subtle">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold tracking-widest uppercase mb-4">
            API_DOCS
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <div className="h-px w-12 bg-primary/30" />
            <p className="text-sm text-gray-500 font-fragmented uppercase tracking-wider">
              ParamTune API for managing platform schemas and versions
            </p>
          </div>
          <a
            href="/openapi.yaml"
            className="inline-block mt-4 text-[10px] font-display font-bold text-primary tracking-[0.3em] hover:text-white transition-colors uppercase"
          >
            VIEW_OPENAPI_SPEC &rarr;
          </a>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-0 mb-8 border-b border-primary/20">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-6 py-3 text-[11px] font-display font-bold uppercase tracking-[0.25em] transition-colors border-b-2 -mb-px ${
              activeTab === 'guide'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Guide
          </button>
          <button
            onClick={() => setActiveTab('reference')}
            className={`px-6 py-3 text-[11px] font-display font-bold uppercase tracking-[0.25em] transition-colors border-b-2 -mb-px ${
              activeTab === 'reference'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Reference
          </button>
        </div>

        {activeTab === 'guide' && (
          <div className="space-y-12">
            {/* Quick Start */}
            <section>
              <h2 className="text-lg font-display font-bold uppercase tracking-widest mb-2">
                Quick_Start
              </h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px w-8 bg-primary/30" />
                <p className="text-xs text-gray-500 font-fragmented uppercase tracking-wider">
                  Go from zero to a resolved schema in four steps
                </p>
              </div>

              <div className="space-y-4">
                {guideSteps.map((step, i) => (
                  <Card key={i} variant="outlined">
                    <div className="flex items-start gap-4">
                      <StepNumber n={i + 1} />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-display font-bold uppercase tracking-widest mb-1">
                          {step.title.replace(/^\d+\.\s*/, '')}
                        </h3>
                        <p className="text-xs text-gray-500 font-fragmented mb-3 leading-relaxed">
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
              <h2 className="text-lg font-display font-bold uppercase tracking-widest mb-2">
                Schema_Composition
              </h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px w-8 bg-primary/30" />
                <p className="text-xs text-gray-500 font-fragmented uppercase tracking-wider">
                  Inherit, override, and compose schemas across platforms
                </p>
              </div>

              <div className="space-y-4">
                {compositionExamples.map((ex, i) => (
                  <Card key={i} variant="outlined">
                    <h3 className="text-sm font-display font-bold uppercase tracking-widest mb-1">
                      {ex.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-fragmented mb-3 leading-relaxed">
                      {ex.description}
                    </p>
                    <CodeBlock>{ex.code}</CodeBlock>
                  </Card>
                ))}
              </div>
            </section>

            {/* Validation & Errors */}
            <section>
              <h2 className="text-lg font-display font-bold uppercase tracking-widest mb-2">
                Validation
              </h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px w-8 bg-primary/30" />
                <p className="text-xs text-gray-500 font-fragmented uppercase tracking-wider">
                  What gets checked before a schema is saved
                </p>
              </div>

              <Card variant="outlined">
                <ul className="space-y-3 text-xs font-fragmented text-gray-400">
                  <li className="flex items-start gap-3">
                    <span className="text-primary/60 mt-0.5">&#x25B8;</span>
                    <span>Content must be a plain JSON object — arrays, strings, and null are rejected.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary/60 mt-0.5">&#x25B8;</span>
                    <span>Every <code className="text-primary/80">@extends</code> reference must resolve to an existing platform/version pair.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary/60 mt-0.5">&#x25B8;</span>
                    <span>Semver ranges must match at least one published version.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-primary/60 mt-0.5">&#x25B8;</span>
                    <span>Circular dependency chains are detected at any depth and rejected with a clear error message.</span>
                  </li>
                </ul>
              </Card>
            </section>

            {/* Error format */}
            <div className="p-6 border border-primary/30 bg-black/50">
              <h3 className="font-display font-bold uppercase tracking-widest text-sm mb-3">
                Error_Format
              </h3>
              <p className="text-xs text-gray-500 mb-3 font-fragmented leading-relaxed">
                All error responses share a consistent shape. HTTP status codes follow REST conventions: 400 for bad input, 404 for missing resources, and 500 for server failures.
              </p>
              <CodeBlock>{'{ "error": "Error message" }'}</CodeBlock>
            </div>
          </div>
        )}

        {activeTab === 'reference' && (
          <>
            <div className="space-y-4">
              {endpoints.map((endpoint, index) => (
                <Card key={index} variant="outlined">
                  <div className="flex items-center gap-3 mb-3">
                    <MethodBadge method={endpoint.method} />
                    <code className="text-sm font-fragmented bg-black/50 px-3 py-1 border border-primary/20">
                      {endpoint.path}
                    </code>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 font-fragmented">
                    {endpoint.description}
                  </p>

                  {endpoint.requestBody && (
                    <div className="mb-4">
                      <h4 className="text-[10px] font-display font-bold uppercase tracking-widest text-primary mb-2">
                        REQUEST_BODY
                      </h4>
                      <p className="text-xs text-gray-500 mb-1 font-fragmented">
                        {endpoint.requestBody.description}
                      </p>
                      <pre className="text-xs bg-black/50 border border-primary/20 p-3 overflow-x-auto font-fragmented">
                        {endpoint.requestBody.example}
                      </pre>
                    </div>
                  )}

                  <div>
                    <h4 className="text-[10px] font-display font-bold uppercase tracking-widest text-primary mb-2">
                      RESPONSES
                    </h4>
                    <div className="space-y-2">
                      {endpoint.responses.map((response, rIndex) => (
                        <div key={rIndex} className="text-xs">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={response.status < 400 ? 'outline' : 'destructive'}
                              className="text-xs"
                            >
                              {response.status}
                            </Badge>
                            <span className="text-gray-500 font-fragmented">
                              {response.description}
                            </span>
                          </div>
                          {response.example && (
                            <pre className="bg-black/50 border border-primary/20 p-3 overflow-x-auto font-fragmented">
                              {response.example}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="mt-8 p-6 border border-primary/30 bg-black/50">
              <h3 className="font-display font-bold uppercase tracking-widest text-sm mb-3">
                ERROR_RESPONSES
              </h3>
              <p className="text-sm text-gray-500 mb-3 font-fragmented">
                All endpoints return errors in the following format:
              </p>
              <pre className="text-xs bg-black/50 border border-primary/20 p-3 font-fragmented">
                {'{ "error": "Error message" }'}
              </pre>
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  )
}
