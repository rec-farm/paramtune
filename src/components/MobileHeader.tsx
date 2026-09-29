'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'

const MobileAuthNav = dynamic(() => import('./MobileAuthNav'), { ssr: false })

export default function MobileHeader() {
  const { open } = useSidebar()

  return (
    <header className="sticky top-0 z-40 md:hidden bg-background border-b border-border">
      <div className="flex items-center justify-between h-16 px-2">
        <button
          onClick={open}
          className="flex items-center justify-center h-12 w-12 hover:bg-surface-2 transition-colors duration-150"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>

        <Link
          href="/"
          className="pt-display text-sm inline-flex items-center min-h-12"
        >
          Paramtune
        </Link>

        <MobileAuthNav />
      </div>
    </header>
  )
}
