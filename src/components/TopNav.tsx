'use client'

import Link from 'next/link'
import Button from './ui/Button'
import Logo from './Logo'
import { useSidebarSafe } from '@/contexts/SidebarContext'

export default function TopNav() {
  const sidebarContext = useSidebarSafe()

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button - only show if sidebar context is available */}
            {sidebarContext && (
              <button
                onClick={sidebarContext.toggle}
                className="md:hidden p-2 rounded-md hover:bg-muted/50 transition-colors"
                aria-label="Toggle sidebar"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}

            <Logo asLink className="group" />
          </div>

          <nav className="flex items-center gap-2">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

