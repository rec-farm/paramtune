'use client'

import { useState, useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
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
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center h-8 pl-12 pr-4 text-sm tabular-nums transition-colors duration-150',
        isActive
          ? 'bg-accent-dim text-foreground shadow-[inset_2px_0_0_var(--pt-accent)]'
          : 'text-muted-foreground hover:bg-surface-2'
      )}
      href="/dashboard/[platform]/[version]"
      as={`/dashboard/${encodeURIComponent(platform)}/${encodeURIComponent(
        version
      )}`}
    >
      v{version}
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
  const pathname = usePathname()
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const active: Record<string, boolean> = {}
    platforms.forEach((p) => {
      const href = `/dashboard/${encodeURIComponent(p.name)}`
      if (pathname === href || pathname.startsWith(`${href}/`)) {
        active[p.name] = true
      }
    })
    return active
  })

  const filteredPlatforms = useMemo(
    () =>
      platforms.filter(
        (platform) =>
          platform.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (platform.versions &&
            platform.versions.some((version) =>
              version.toLowerCase().includes(searchQuery.toLowerCase())
            ))
      ),
    [platforms, searchQuery]
  )

  // Expand active platform by default (store prev in state per React docs)
  const [prevPathname, setPrevPathname] = useState(pathname)
  const [prevFiltered, setPrevFiltered] = useState(filteredPlatforms)
  if (prevPathname !== pathname || prevFiltered !== filteredPlatforms) {
    setPrevPathname(pathname)
    setPrevFiltered(filteredPlatforms)
    const active: Record<string, boolean> = {}
    filteredPlatforms.forEach((p) => {
      const href = `/dashboard/${encodeURIComponent(p.name)}`
      const isActive = pathname === href || pathname.startsWith(`${href}/`)
      if (isActive) active[p.name] = true
    })
    if (Object.keys(active).length > 0) {
      setOpen((prev) => ({ ...active, ...prev }))
    }
  }

  if (filteredPlatforms.length === 0) {
    return (
      <p className="text-sm text-muted-foreground px-4 py-3">
        {searchQuery
          ? 'No platforms match your search. Clear it to see all platforms.'
          : 'No platforms yet. Create one from the dashboard.'}
      </p>
    )
  }

  return (
    <ul>
      {filteredPlatforms.map((platform) => {
        const platformHref = `/dashboard/${encodeURIComponent(platform.name)}`
        const isCurrentPlatform = pathname === platformHref
        const isExpanded = !!open[platform.name]

        return (
          <li key={platform.name}>
            <div
              className={cn(
                'flex items-center h-10 transition-colors duration-150',
                isCurrentPlatform
                  ? 'bg-accent-dim shadow-[inset_2px_0_0_var(--pt-accent)]'
                  : 'hover:bg-surface-2'
              )}
            >
              <button
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${platform.name} versions`}
                aria-expanded={isExpanded}
                className="flex items-center justify-center h-10 w-10 ml-1 text-muted-foreground hover:text-foreground"
                onClick={() =>
                  setOpen((prev) => ({
                    ...prev,
                    [platform.name]: !prev[platform.name],
                  }))
                }
              >
                <ChevronRight
                  className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    isExpanded && 'rotate-90'
                  )}
                  strokeWidth={1.5}
                />
              </button>
              <Link
                aria-current={isCurrentPlatform ? 'page' : undefined}
                className={cn(
                  'flex-1 min-w-0 flex items-center justify-between gap-2 h-10 pr-4 text-sm',
                  isCurrentPlatform ? 'text-foreground' : 'text-muted-foreground'
                )}
                href="/dashboard/[platform]"
                as={platformHref}
              >
                <span className="truncate">{platform.name}</span>
                <span className="text-xs text-meta tabular-nums">
                  {platform.versions?.length ?? 0}
                </span>
              </Link>
            </div>

            {platform.versions &&
              platform.versions.length > 0 &&
              isExpanded && (
                <ul>
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
          </li>
        )
      })}
    </ul>
  )
}
