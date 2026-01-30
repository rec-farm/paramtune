import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import NavHeader from '@/components/NavHeader'

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

function MethodBadge({ method }: { method: 'GET' | 'POST' }) {
  return (
    <Badge variant={method === 'GET' ? 'secondary' : 'success'}>
      {method}
    </Badge>
  )
}

export default function ApiDocsPage() {
  return (
    <>
      <NavHeader />
      <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Documentation</h1>
        <p className="text-muted-foreground mb-4">
          ParamTune API for managing platform schemas and versions.
        </p>
        <a
          href="/openapi.yaml"
          className="text-sm text-primary hover:underline"
        >
          View OpenAPI Specification →
        </a>
      </div>

      <div className="space-y-4">
        {endpoints.map((endpoint, index) => (
          <Card key={index} variant="outlined">
            <div className="flex items-center gap-3 mb-3">
              <MethodBadge method={endpoint.method} />
              <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {endpoint.path}
              </code>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {endpoint.description}
            </p>

            {endpoint.requestBody && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Request Body</h4>
                <p className="text-xs text-muted-foreground mb-1">
                  {endpoint.requestBody.description}
                </p>
                <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                  {endpoint.requestBody.example}
                </pre>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium mb-2">Responses</h4>
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
                      <span className="text-muted-foreground">
                        {response.description}
                      </span>
                    </div>
                    {response.example && (
                      <pre className="bg-muted p-2 rounded overflow-x-auto">
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

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h3 className="font-medium mb-2">Error Responses</h3>
        <p className="text-sm text-muted-foreground mb-2">
          All endpoints return errors in the following format:
        </p>
        <pre className="text-xs bg-background p-2 rounded">
          {'{ "error": "Error message" }'}
        </pre>
      </div>
    </div>
    </>
  )
}
