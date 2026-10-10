import type { Platform } from '@/shared/contracts'
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { useLocation } from 'react-router'
import {
  GitCompare,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Search,
  ShieldCheck,
  Terminal,
  X,
} from 'lucide-react'
import PlatformsList from '@/components/NavigationPlatforms/PlatformsList'
import { cn } from '@/lib/utils'
import { useSidebar } from '@/contexts/SidebarContext'
import { NAV_ITEM_ACTIVE, NAV_ITEM_IDLE } from '@/components/NavigationPlatforms/navItem'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import Logo from '@/components/Logo'
import { signOut } from '@/lib/auth-client'

type SidebarProps = {
  platforms: Platform[]
  version: string
  /** Shows administration links such as API tokens. */
  canManage: boolean
}

export default function Sidebar({ platforms, version, canManage }: SidebarProps) {
  const { isOpen, close } = useSidebar()
  const { pathname } = useLocation()
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
  const isOverviewActive = pathname === '/dashboard'
  const isCompareActive = pathname === '/dashboard/compare'
  const isTokensActive = pathname === '/dashboard/settings/tokens'
  const navItem = (active: boolean) =>
    cn(
      'flex items-center gap-3 h-10 mx-3 px-3 rounded-sm text-base font-medium transition-colors duration-150',
      active ? NAV_ITEM_ACTIVE : NAV_ITEM_IDLE
    )

  const sidebarContent = (
    <div className="h-full flex flex-col">
      {/* Wordmark row (§10.3): 64px, 20px padding-x. 28px keeps the mark above
          its 20px minimum (BRAND §2.4) and matches StillUp's lockup size */}
      <div className="h-16 shrink-0 flex items-center px-5">
        <Logo asLink tone="cream" height={28} />
      </div>

      {/* Workspace card (§10.3) */}
      <div className="mx-3 flex items-center gap-3 rounded-sm border border-sidebar-border p-3">
        <span className="h-8 w-8 shrink-0 flex items-center justify-center rounded-xs bg-[var(--color-lilac-300)] text-sm font-bold text-[var(--color-ink-950)]">
          M
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">My workspace</p>
          <p className="text-xs text-sidebar-muted truncate">Self-hosted installation</p>
        </div>
        <ShieldCheck className="h-4 w-4 shrink-0 text-sidebar-muted" strokeWidth={1.5} aria-hidden="true" />
      </div>

      {/* Global search lives at the top of the sidebar (§10.2) */}
      <div className="px-3 pt-3">
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
        <div className="space-y-1">
          <div className="pt-eyebrow text-sidebar-muted px-6 pb-1">Workspace</div>
          <Link
            to="/dashboard"
            aria-current={isOverviewActive ? 'page' : undefined}
            className={navItem(isOverviewActive)}
          >
            <LayoutDashboard className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            Overview
          </Link>
          <Link
            to="/dashboard/compare"
            aria-current={isCompareActive ? 'page' : undefined}
            className={navItem(isCompareActive)}
          >
            <GitCompare className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            Compare schemas
          </Link>
          {canManage && <Link
            to="/dashboard/settings/tokens"
            aria-current={isTokensActive ? 'page' : undefined}
            className={navItem(isTokensActive)}
          >
            <KeyRound className="h-5 w-5 shrink-0" strokeWidth={1.5} />
            API tokens
          </Link>}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between pl-6 pr-4">
            <div className="pt-eyebrow text-sidebar-muted">Platforms</div>
            <Link
              to="/dashboard"
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center min-h-8 text-xs text-sidebar-muted underline underline-offset-4 hover:text-sidebar-foreground"
            >
              Show all
            </Link>
          </div>
          <PlatformsList platforms={platforms} searchQuery={searchQuery} />
        </div>
      </nav>

      {/* Promo card (§10.3): one per sidebar */}
      <div className="hidden md:block mx-3 mb-2 rounded-sm border border-sidebar-border border-t-[3px] border-t-accent p-4 space-y-2">
        <Terminal className="h-5 w-5 text-sidebar-muted" strokeWidth={1.5} aria-hidden="true" />
        <p className="text-sm font-semibold">Built to be yours.</p>
        <p className="text-xs text-sidebar-muted leading-relaxed">
          Open source. Self hosted.
          <br />
          Always in tune.
        </p>
      </div>

      <button
        onClick={() => signOut()}
        className={cn(navItem(false), 'mb-2 text-left')}
      >
        <LogOut className="h-5 w-5 shrink-0" strokeWidth={1.5} aria-hidden="true" />
        Sign out
      </button>

      <div className="px-6 py-3 border-t border-sidebar-border space-y-3">
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
        {/* Endorsement (§2): Product vX.Y.Z · by REC, the chain at 8px cap height */}
        <p className="flex items-center gap-1 text-xs text-sidebar-muted">
          <span>
            Paramtune <span className="font-mono">v{version}</span> · by
          </span>
          {/* Chain cap is 13.5u of the 48u box, so 28px renders an 8px cap.
              Negative margins trim the box's empty top and bottom. */}

          <img
            src="/brand/rec-mark-cream.svg"
            alt="R.E.C."
            width={28}
            height={28}
            className="-my-2.5 opacity-70"
          />
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
