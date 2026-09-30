'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import Logo from './Logo'
import { useSidebarSafe } from '@/contexts/SidebarContext'

export default function TopNav() {
  const sidebarContext = useSidebarSafe()

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile menu button - only show if sidebar context is available */}
            {sidebarContext && (
              <button
                onClick={sidebarContext.toggle}
                className="md:hidden flex items-center justify-center h-10 w-10 hover:bg-surface-2 transition-colors duration-150"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-5 w-5" strokeWidth={1.5} />
              </button>
            )}

            <Logo asLink className="group" />
          </div>

          <nav className="flex items-center gap-2">
            <Link href="/" className="pt-btn pt-btn-ghost h-8 px-3 text-xs">
              Home
            </Link>
            <Link href="/dashboard" className="pt-btn pt-btn-secondary h-8 px-3 text-xs">
              Dashboard
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

