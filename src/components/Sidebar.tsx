'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
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
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  // Resizing removed; fixed width sidebar
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // Removed MIN/MAX/DEFAULT widths – using Tailwind fixed width

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

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

  // Removed resizing effects and handlers

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Branding header with subtle scroll indicator */}
      <div
        className={cn(
          'px-5 py-4 border-b border-sidebar-border/50 transition-all duration-200',
          isScrolled && 'shadow-sm'
        )}
      >
        <div className="space-y-5">
          {/* Logo + slogan */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <div className="h-4 w-4 rounded bg-primary-foreground/90" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-lg leading-5 tracking-tight text-sidebar-foreground">
                ParamTune
              </div>
              <div className="text-[11px] leading-4 text-sidebar-foreground/60 truncate">
                Tune feature flags & schemas at scale
              </div>
            </div>
          </div>

          {/* Search input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-4 w-4 text-sidebar-foreground/40"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              aria-label="Search"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full pl-10 pr-12 py-2 text-sm bg-sidebar/50 border border-sidebar-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-colors placeholder:text-sidebar-foreground/40"
            />
            {/* Right-side hint or clear */}
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sidebar-foreground/40 hover:text-sidebar-foreground/60 transition-colors"
                aria-label="Clear search"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            ) : (
              <div
                className={cn(
                  'absolute inset-y-0 right-0 pr-3 flex items-center text-[11px] text-sidebar-foreground/40 transition-opacity',
                  isSearchFocused ? 'opacity-0' : 'opacity-100'
                )}
                aria-hidden="true"
              >
                <kbd className="px-1.5 py-0.5 rounded border border-sidebar-border/60 bg-sidebar/60">
                  /
                </kbd>
              </div>
            )}
          </div>

          {/* Show all platforms control moved to Platforms header below */}
        </div>
      </div>

      {/* Scrollable content area with subtle fades */}
      <div className="relative flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-sidebar-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-sidebar-foreground/30">
        {/* Top/Bottom gradient fades */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-sidebar to-transparent z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-sidebar to-transparent z-10" />
        <div className="px-5 py-5 space-y-4 relative z-0">
          <div className="flex items-center justify-between px-1">
            <div className="text-[11px] uppercase tracking-wide text-sidebar-foreground/50">
              Platforms
            </div>
            <Link
              href="/dashboard"
              onClick={() => setSearchQuery('')}
              className="text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground/80 underline underline-offset-4"
            >
              Show all
            </Link>
          </div>
          <div className="text-sm">
            <PlatformsList platforms={platforms} searchQuery={searchQuery} />
          </div>

          {/* RECENT section removed per design */}
        </div>
      </div>

      {/* Footer with subtle gradient */}
      <div className="p-3 border-t border-sidebar-border/50 bg-gradient-to-t from-sidebar/50 to-transparent">
        <div className="text-xs text-sidebar-foreground/50 text-center">
          ParamTune v1.0
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'shrink-0 transition-transform duration-300 ease-in-out w-72',
          'md:block md:relative md:translate-x-0',
          isOpen
            ? 'fixed inset-y-0 left-0 z-50 translate-x-0'
            : 'fixed inset-y-0 left-0 z-50 -translate-x-full'
        )}
      >
        <div className="relative sticky top-0 h-[100vh] bg-sidebar border-r border-sidebar-border">
          {sidebarContent}
          {/* Resizer removed */}
        </div>
      </aside>
    </>
  )
}
