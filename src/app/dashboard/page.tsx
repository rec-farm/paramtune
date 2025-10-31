import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import CreatePlatformForm from '@/components/CreatePlatformForm'
import { getPlatforms, savePlatform } from '@/models/Platform'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const platforms = await getPlatforms()

  async function createPlatform(formData: FormData) {
    'use server'

    const platformName = formData.get('platformName') as string
    console.log('Server action received:', platformName)

    if (!platformName || platformName.trim() === '') {
      throw new Error('Platform name is required')
    }

    try {
      await savePlatform(platformName.trim(), {
        name: platformName.trim(),
        versions: [],
      })
      console.log('Platform saved successfully:', platformName.trim())
      revalidatePath('/dashboard')
    } catch (error) {
      console.error('Error saving platform:', error)
      throw error
    }
  }

  return (
    <div className="space-y-8">
      <Card
        title="Platforms"
        subtitle="Manage and configure your application platforms"
        variant="elevated"
      >
        {platforms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <div className="w-8 h-8 rounded bg-muted-foreground/20" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No platforms yet</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Create your first platform to start managing configurations and
              schemas
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {platforms.map((platform: any) => {
              const latestVersion =
                platform.versions?.[platform.versions.length - 1]
              const href = `/dashboard/${encodeURIComponent(platform.name)}`
              return (
                <Link
                  key={platform.name}
                  href={href}
                  className="group relative card p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-border/50 hover:border-border focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                          {platform.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {platform.versions?.length || 0} versions
                          </Badge>
                          <Badge variant="success" className="text-[10px]">
                            Active
                          </Badge>
                        </div>
                        {latestVersion && (
                          <p className="text-xs text-muted-foreground">
                            Latest: v{latestVersion}
                          </p>
                        )}
                      </div>

                      <div className="opacity-70 group-hover:opacity-100 transition-opacity duration-200">
                        <Button variant="ghost" size="sm" aria-label="Open">
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
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/30">
                      <span className="inline-flex items-center text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                        Open configurations
                        <svg
                          className="w-4 h-4 ml-1"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </Card>

      <Card
        title="Create Platform"
        subtitle="Add a new platform to manage its configurations"
      >
        <CreatePlatformForm action={createPlatform} />
      </Card>
    </div>
  )
}
