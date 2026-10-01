'use client'

import dynamic from 'next/dynamic'
import { Menu } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'
import Logo from './Logo'

const MobileAuthNav = dynamic(() => import('./MobileAuthNav'), { ssr: false })

export default function MobileHeader() {
  const { open } = useSidebar()

  return (
    <header className="sticky top-0 z-40 md:hidden bg-background border-b border-border">
      <div className="flex items-center justify-between h-14 px-2">
        <button
          onClick={open}
          className="flex items-center justify-center h-11 w-11 rounded-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors duration-150"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.5} />
        </button>

        <Logo asLink height={18} />

        <MobileAuthNav />
      </div>
    </header>
  )
}
