'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'

export default function MobileHeader() {
  const { open } = useSidebar()

  return (
    <header className="sticky top-0 z-40 md:hidden glass">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Hamburger button */}
        <button
          onClick={open}
          className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-sidebar-foreground/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo / Branding */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <div className="h-3.5 w-3.5 rounded bg-primary-foreground/90" />
          </div>
          <span className="font-bold text-base tracking-tight">ParamTune</span>
        </div>

        {/* Spacer to balance the header */}
        <div className="w-10" />
      </div>
    </header>
  )
}
