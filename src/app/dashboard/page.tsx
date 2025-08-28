import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { getPlatforms, savePlatform } from '@/models/Platform'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const platforms = await getPlatforms()

  async function createPlatform(formData: FormData) {
    'use server'

    const platformName = formData.get('platformName') as string

    if (!platformName || platformName.trim() === '') {
      throw new Error('Platform name is required')
    }

    await savePlatform(platformName.trim(), {
      name: platformName.trim(),
      versions: [],
    })

    revalidatePath('/dashboard')
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
            {platforms.map((platform: any) => (
              <div
                key={platform.id}
                className="group relative card p-5 hover:shadow-lg transition-all duration-300 border-border/50 hover:border-border"
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
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Link
                        href={`/dashboard/${encodeURIComponent(platform.name)}`}
                      >
                        <Button variant="ghost" size="sm">
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
                      </Link>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/30">
                    <Link
                      className="block w-full text-left hover:bg-accent/50 p-2 -m-2 rounded-md transition-colors text-sm text-muted-foreground hover:text-foreground"
                      href={`/dashboard/${encodeURIComponent(platform.name)}`}
                    >
                      View configurations →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card
        title="Create Platform"
        subtitle="Add a new platform to manage its configurations"
      >
        <form action={createPlatform} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="platformName"
              className="text-sm font-medium text-foreground"
            >
              Platform Name
            </label>
            <Input
              id="platformName"
              type="text"
              name="platformName"
              placeholder="Enter platform name (e.g., iOS, Android, Web)"
              className="max-w-md"
              required
            />
          </div>
          <Button type="submit" className="w-auto">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Platform
          </Button>
        </form>
      </Card>
    </div>
  )
}
