import { useState, useMemo } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { useLocation } from 'react-router'
import { cn } from '@/lib/utils'
import { sortVersionsDescending } from '@/lib/versionUtils'
import { NAV_ITEM_ACTIVE, NAV_ITEM_IDLE } from './navItem'

type Platform = {
  name: string
  versions: string[]
}

type VersionProps = {
  platform: string
  version: string
}

const Version = ({ platform, version }: VersionProps) => {
  const { pathname } = useLocation()
  const isActive =
    pathname ===
    `/dashboard/${encodeURIComponent(platform)}/${encodeURIComponent(version)}`

  return (
    <Link
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center h-8 ml-10 mr-3 px-3 rounded-sm font-mono text-sm tabular-nums transition-colors duration-150',
        isActive ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE
      )}
      to={`/dashboard/${encodeURIComponent(platform)}/${encodeURIComponent(
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
  const { pathname } = useLocation()
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
      <p className="text-sm text-sidebar-muted px-4 py-3">
        {searchQuery
          ? 'Nothing matches that search. Clear it to see every platform.'
          : 'No platforms yet. Create your first one from the overview.'}
      </p>
    )
  }

  return (
    <ul className="space-y-0.5">
      {filteredPlatforms.map((platform) => {
        const platformHref = `/dashboard/${encodeURIComponent(platform.name)}`
        const isCurrentPlatform = pathname === platformHref
        const isExpanded = !!open[platform.name]

        return (
          <li key={platform.name}>
            <div
              className={cn(
                'flex items-center h-10 mx-3 rounded-sm transition-colors duration-150',
                isCurrentPlatform ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE
              )}
            >
              <button
                aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${platform.name} versions`}
                aria-expanded={isExpanded}
                className="flex items-center justify-center h-9 w-8 shrink-0 opacity-80 hover:opacity-100"
                onClick={() =>
                  setOpen((prev) => ({
                    ...prev,
                    [platform.name]: !prev[platform.name],
                  }))
                }
              >
                <ChevronRight
                  className={cn(
                    'w-4 h-4 transition-transform duration-200',
                    isExpanded && 'rotate-90'
                  )}
                  strokeWidth={1.5}
                />
              </button>
              <Link
                aria-current={isCurrentPlatform ? 'page' : undefined}
                className={cn(
                  'flex-1 min-w-0 flex items-center justify-between gap-2 h-9 pr-3 font-mono text-sm'
                )}
                to={platformHref}
              >
                <span className="truncate">{platform.name}</span>
                <span className="font-mono text-xs tabular-nums opacity-80">
                  {platform.versions?.length ?? 0}
                </span>
              </Link>
            </div>

            {platform.versions &&
              platform.versions.length > 0 &&
              isExpanded && (
                <ul className="mt-0.5 space-y-0.5">
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
