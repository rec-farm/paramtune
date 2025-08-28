import Badge from '@/components/ui/Badge'
import { getPlatforms } from '@/models/Platform'
import Link from 'next/link'
import { Suspense } from 'react'

async function getPlatformsFromServer() {
  'use server'
  return getPlatforms()
}

type VersionProps = {
  platform: string
  version: string
}

const Version = ({ platform, version }: VersionProps) => (
  <li>
    <Link
      className="block px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-all duration-200 group"
      href="/dashboard/[platform]/[version]"
      as={`/dashboard/${encodeURIComponent(platform)}/${encodeURIComponent(
        version
      )}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono">v{version}</span>
        <div className="w-2 h-2 rounded-full bg-green-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      </div>
    </Link>
  </li>
)

const LoadingSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-2">
        <div className="h-6 bg-muted rounded shimmer" />
        <div className="pl-4 space-y-1">
          <div className="h-4 bg-muted/50 rounded shimmer w-3/4" />
          <div className="h-4 bg-muted/50 rounded shimmer w-1/2" />
        </div>
      </div>
    ))}
  </div>
)

const NavigationPlatforms = async () => {
  const platforms = await getPlatformsFromServer()

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <div className="space-y-2">
        {platforms.length === 0 ? (
          <div className="text-xs text-muted-foreground px-3 py-4 text-center">
            No platforms found
          </div>
        ) : (
          platforms.map((platform) => (
            <div key={platform.name} className="space-y-1">
              <Link
                className="group flex items-center justify-between px-3 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md transition-all duration-200"
                href="/dashboard/[platform]"
                as={`/dashboard/${encodeURIComponent(platform.name)}`}
              >
                <span className="truncate">{platform.name}</span>
                <div className="flex items-center gap-2">
                  {platform.versions && platform.versions.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      {platform.versions.length}
                    </Badge>
                  )}
                  <div className="w-2 h-2 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>
              </Link>

              {platform.versions && platform.versions.length > 0 && (
                <ul className="ml-4 space-y-1 border-l border-border/50">
                  {platform.versions.map((version) => (
                    <Version
                      key={`${platform.name}-${version}`}
                      platform={platform.name}
                      version={version}
                    />
                  ))}
                </ul>
              )}
            </div>
          ))
        )}
      </div>
    </Suspense>
  )
}

export default NavigationPlatforms
