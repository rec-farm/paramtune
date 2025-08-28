import { revalidatePath } from 'next/cache'
import { Suspense } from 'react'

import JsonEditable from '@/components/JsonEditable'
import JsonOutput from '@/components/JsonOutput'
import PageTitle from '@/components/PageTitle'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { getSchema, saveSchema } from '@/models/Schema'

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

  // Create a better default schema if none exists
  const defaultSchema = {
    appConfig: {
      name: `${platformName} Configuration`,
      version: versionName,
      environment: 'development',
    },
    features: {
      authentication: true,
      notifications: true,
      analytics: false,
    },
    ui: {
      theme: 'dark',
      primaryColor: '#3b82f6',
      animations: true,
    },
    api: {
      baseUrl: 'https://api.example.com',
      timeout: 5000,
      retries: 3,
    },
  }

  async function updateSchema(formData: FormData) {
    'use server'

    const content = JSON.parse(formData.get('content') as string)
    await saveSchema(platformName, versionName, content)

    revalidatePath('/dashboard/[platform]/[version]', 'page')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle platform={platformName} version={versionName} />
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            JSON Schema
          </Badge>
          <Badge variant="outline" className="text-xs">
            Status: {schema ? 'Configured' : 'New'}
          </Badge>
        </div>
      </div>

      {/* Header Cards with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Schema Size</div>
            <div className="text-2xl font-bold">
              {schema?.content
                ? Object.keys(schema.content).length
                : Object.keys(defaultSchema).length}
            </div>
            <div className="text-xs text-muted-foreground">properties</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Environment</div>
            <div className="text-2xl font-bold capitalize">
              {(schema?.content as any)?.appConfig?.environment ||
                defaultSchema.appConfig.environment}
            </div>
            <div className="text-xs text-muted-foreground">current env</div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium">Active</span>
            </div>
            <div className="text-xs text-muted-foreground">
              configuration valid
            </div>
          </div>
        </Card>
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Schema Editor */}
          <div className="space-y-4">
            <Card
              title="Configuration Schema"
              subtitle="Edit your platform configuration in real-time"
              variant="elevated"
            >
              <form action={updateSchema}>
                <JsonEditable
                  title=""
                  name="content"
                  defaultValue={JSON.stringify(
                    schema?.content || defaultSchema,
                    null,
                    2
                  )}
                />

                <div className="mt-6 pt-4 border-t border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Make sure your JSON is valid before saving
                    </div>
                    <Button type="submit" variant="primary" className="gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Save Configuration
                    </Button>
                  </div>
                </div>
              </form>
            </Card>

            {/* Quick Actions */}
            <Card title="Quick Actions" className="p-4">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Load Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  Copy Schema
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  Validate
                </Button>
              </div>
            </Card>
          </div>

          {/* Output Preview */}
          <div className="space-y-4">
            <Card
              title="Live Preview"
              subtitle="See how your configuration will be consumed"
              variant="elevated"
            >
              <JsonOutput
                title=""
                content={(schema?.output as any) || defaultSchema}
              />
            </Card>

            {/* Documentation */}
            <Card title="Configuration Guide" className="p-4">
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Schema Structure</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>
                      •{' '}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        appConfig
                      </code>{' '}
                      - Basic application settings
                    </li>
                    <li>
                      •{' '}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        features
                      </code>{' '}
                      - Feature flags and toggles
                    </li>
                    <li>
                      •{' '}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        ui
                      </code>{' '}
                      - User interface configuration
                    </li>
                    <li>
                      •{' '}
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        api
                      </code>{' '}
                      - API endpoints and settings
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Best Practices</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Use clear, descriptive property names</li>
                    <li>• Group related settings together</li>
                    <li>• Provide sensible defaults</li>
                    <li>• Validate before saving</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Suspense>
    </div>
  )
}
