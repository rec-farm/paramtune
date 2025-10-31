'use client'

import { useState, useEffect } from 'react'
import Badge from '@/components/ui/Badge'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { sortVersionsDescending } from '@/lib/versionUtils'

type Platform = {
  name: string
  versions: string[]
}

type VersionProps = {
  platform: string
  version: string
}

const Version = ({ platform, version }: VersionProps) => {
  const pathname = usePathname()
  const isActive =
    pathname ===
    `/dashboard/${encodeURIComponent(platform)}/${encodeURIComponent(version)}`

  return (
    <Link
      className={cn(
        'block px-3 py-2 text-sm rounded-md transition-colors duration-200 group',
        'hover:text-foreground hover:bg-accent/20',
        isActive ? 'bg-accent/20 text-foreground' : 'text-muted-foreground'
      )}
      href="/dashboard/[platform]/[version]"
      as={`/dashboard/${encodeURIComponent(platform)}/${encodeURIComponent(
        version
      )}`}
    >
      <div className="flex items-center justify-between pl-6">
        <span className="font-mono">v{version}</span>
        <div
          className={cn(
            'w-1.5 h-1.5 rounded-full transition-opacity duration-200',
            isActive
              ? 'bg-primary/80 opacity-80'
              : 'bg-primary/60 opacity-0 group-hover:opacity-60'
          )}
        />
      </div>
    </Link>
  )
}

type PlatformsListProps = {
  platforms: Platform[]
  searchQuery: string
}

export default function PlatformsList({
  platforms,
  searchQuery,
}: PlatformsListProps) {
  const [filteredPlatforms, setFilteredPlatforms] =
    useState<Platform[]>(platforms)
  const pathname = usePathname()
  const [open, setOpen] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const filtered = platforms.filter(
      (platform) =>
        platform.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (platform.versions &&
          platform.versions.some((version) =>
            version.toLowerCase().includes(searchQuery.toLowerCase())
          ))
    )
    setFilteredPlatforms(filtered)
  }, [platforms, searchQuery])

  // Expand active platform by default
  useEffect(() => {
    const active: Record<string, boolean> = {}
    filteredPlatforms.forEach((p) => {
      const href = `/dashboard/${encodeURIComponent(p.name)}`
      const isActive = pathname === href || pathname.startsWith(`${href}/`)
      if (isActive) active[p.name] = true
    })
    setOpen((prev) => ({ ...active, ...prev }))
  }, [filteredPlatforms, pathname])

  if (filteredPlatforms.length === 0) {
    return (
      <div className="text-xs text-muted-foreground px-3 py-4 text-center">
        {searchQuery ? 'No platforms match your search' : 'No platforms found'}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {filteredPlatforms.map((platform) => {
        const platformHref = `/dashboard/${encodeURIComponent(platform.name)}`
        const isActivePlatform =
          pathname === platformHref || pathname.startsWith(`${platformHref}/`)

        return (
          <div key={platform.name} className="space-y-1">
            <div className="flex items-center">
              <button
                aria-label="Toggle versions"
                className={cn(
                  'mr-1 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-ring'
                )}
                onClick={() =>
                  setOpen((prev) => ({
                    ...prev,
                    [platform.name]: !prev[platform.name],
                  }))
                }
              >
                <svg
                  className={cn(
                    'w-4 h-4 transition-transform',
                    open[platform.name] ? 'rotate-90' : 'rotate-0'
                  )}
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
              </button>
              <Link
                className={cn(
                  'group flex-1 flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                  'hover:bg-accent/20',
                  isActivePlatform
                    ? 'bg-accent/20 text-foreground'
                    : 'text-foreground'
                )}
                href="/dashboard/[platform]"
                as={platformHref}
              >
                <span className="truncate">{platform.name}</span>
                <div className="flex items-center gap-2">
                  {platform.versions && platform.versions.length > 0 && (
                    <Badge variant="secondary" className="text-xs px-2 py-0">
                      {platform.versions.length}
                    </Badge>
                  )}
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 opacity-0 group-hover:opacity-60 transition-opacity duration-200" />
                </div>
              </Link>
            </div>

            {platform.versions &&
              platform.versions.length > 0 &&
              open[platform.name] && (
                <ul className="space-y-1">
                  {sortVersionsDescending(
                    platform.versions.filter(
                      (version) =>
                        !searchQuery ||
                        version
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                    )
                  ).map((version) => (
                    <li key={`${platform.name}-${version}`}>
                      <Version platform={platform.name} version={version} />
                    </li>
                  ))}
                </ul>
              )}
          </div>
        )
      })}
    </div>
  )
}
