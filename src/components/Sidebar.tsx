'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { GitCompare, Search, X } from 'lucide-react'
import PlatformsList from '@/components/NavigationPlatforms/PlatformsList'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/contexts/SidebarContext'
import { NAV_ITEM_ACTIVE, NAV_ITEM_IDLE } from '@/components/NavigationPlatforms/navItem'
import ThemeSwitcher from '@/components/ThemeSwitcher'

type Platform = {
  name: string
  versions: string[]
}

type SidebarProps = {
  platforms: Platform[]
  version: string
}

export default function Sidebar({ platforms, version }: SidebarProps) {
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
      <div className="p-3 border-b border-sidebar-border">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-sidebar-muted">
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
            className="pt-input pl-10 pr-12 bg-sidebar-field border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-muted"
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 w-10 flex items-center justify-center text-sidebar-muted hover:text-sidebar-foreground transition-colors duration-150"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" strokeWidth={1.5} />
            </button>
          ) : (
            <div
              className={cn(
                'absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-sidebar-muted transition-opacity duration-150',
                isSearchFocused ? 'opacity-0' : 'opacity-100'
              )}
              aria-hidden="true"
            >
              <kbd className="px-1.5 rounded-xs border border-sidebar-border font-mono">
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
          <div className="pt-eyebrow text-sidebar-muted px-4 pb-1">Tools</div>
          <Link
            href="/dashboard/compare"
            aria-current={isCompareActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 h-10 mx-3 px-3 rounded-sm text-base font-medium transition-colors duration-150',
              isCompareActive ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE
            )}
          >
            <GitCompare className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            Compare schemas
          </Link>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between px-4">
            <div className="pt-eyebrow text-sidebar-muted">Platforms</div>
            <Link
              href="/dashboard"
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center min-h-8 text-xs text-sidebar-muted underline underline-offset-4 hover:text-sidebar-foreground"
            >
              Show all
            </Link>
          </div>
          <PlatformsList platforms={platforms} searchQuery={searchQuery} />
        </div>
      </nav>

      <div className="px-4 py-3 border-t border-sidebar-border space-y-3">
        <ThemeSwitcher className="md:hidden" />
        <p className="text-xs text-sidebar-muted">
          <span className="font-mono font-medium text-sidebar-foreground tabular-nums">
            {platforms.length}
          </span>{' '}
          {platforms.length === 1 ? 'platform' : 'platforms'} ·{' '}
          <span className="font-mono font-medium text-sidebar-foreground tabular-nums">
            {totalVersions}
          </span>{' '}
          {totalVersions === 1 ? 'version' : 'versions'}
        </p>
        {/* Endorsement (§2): Product vX.Y.Z · by RECIAM with a 16px eye */}
        <p className="flex items-center gap-1.5 text-xs text-sidebar-muted">
          <span>
            Paramtune <span className="font-mono">v{version}</span> · by
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG mark */}
          <img src="/brand/reciam-micro-cream.svg" alt="" width={16} height={16} />
          <span className="font-semibold tracking-wide">RECIAM</span>
        </p>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-overlay z-40 md:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'shrink-0 transition-transform duration-200 ease-out w-64',
          'md:block md:relative md:translate-x-0',
          isOpen
            ? 'fixed inset-y-0 left-0 z-50 translate-x-0'
            : 'fixed inset-y-0 left-0 z-50 -translate-x-full'
        )}
      >
        <div className="h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
          {sidebarContent}
        </div>
      </aside>
    </>
  )
}
