'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GitCompare, Search, X } from 'lucide-react'
import PlatformsList from '@/components/NavigationPlatforms/PlatformsList'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/contexts/SidebarContext'

type Platform = {
  name: string
  versions: string[]
}

type SidebarProps = {
  platforms: Platform[]
}

export default function Sidebar({ platforms }: SidebarProps) {
  const { isOpen, close } = useSidebar()
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // Keyboard shortcut: focus search with '/'
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore if focused inside an input/textarea already
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const editable = (target as HTMLElement | null)?.isContentEditable
      if (tag === 'input' || tag === 'textarea' || editable) return

      if (e.key === '/') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const totalVersions = platforms.reduce(
    (sum, p) => sum + p.versions.length,
    0
  )
  const isCompareActive = pathname === '/dashboard/compare'

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Search header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-meta">
            <Search className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            aria-label="Search platforms and versions"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="pt-input pl-10 pr-12"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 w-10 flex items-center justify-center text-muted-foreground hover:bg-surface-2 transition-colors duration-150"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          ) : (
            <div
              className={cn(
                'absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-meta transition-opacity duration-150',
                isSearchFocused ? 'opacity-0' : 'opacity-100'
              )}
              aria-hidden="true"
            >
              <kbd className="px-1 border border-border-strong bg-surface-2 font-mono">
                /
              </kbd>
            </div>
          )}
        </div>
      </div>

      <nav
        aria-label="Dashboard"
        className="flex-1 overflow-y-auto py-4 space-y-6"
      >
        {/* Tools section */}
        <div className="space-y-1">
          <div className="pt-label text-meta px-4">Tools</div>
          <Link
            href="/dashboard/compare"
            aria-current={isCompareActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 h-10 px-4 text-sm transition-colors duration-150',
              isCompareActive
                ? 'bg-accent-dim text-foreground shadow-[inset_2px_0_0_var(--pt-accent)]'
                : 'text-muted-foreground hover:bg-surface-2'
            )}
          >
            <GitCompare className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            Compare schemas
          </Link>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between px-4">
            <div className="pt-label text-meta">Platforms</div>
            <Link
              href="/dashboard"
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center min-h-8 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Show all
            </Link>
          </div>
          <PlatformsList platforms={platforms} searchQuery={searchQuery} />
        </div>
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border">
        <p className="text-xs text-meta tabular-nums">
          {platforms.length} {platforms.length === 1 ? 'platform' : 'platforms'}{' '}
          · {totalVersions} {totalVersions === 1 ? 'version' : 'versions'}
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'shrink-0 transition-transform duration-200 ease-out w-72',
          'md:block md:relative md:translate-x-0',
          isOpen
            ? 'fixed inset-y-0 left-0 z-50 translate-x-0'
            : 'fixed inset-y-0 left-0 z-50 -translate-x-full'
        )}
      >
        <div className="h-full bg-sidebar border-r border-sidebar-border">
          {sidebarContent}
        </div>
      </aside>
    </>
  )
}
