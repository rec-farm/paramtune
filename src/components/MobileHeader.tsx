'use client'

import dynamic from 'next/dynamic'
import { Menu } from 'lucide-react'
import { useSidebar } from '@/contexts/SidebarContext'

const MobileAuthNav = dynamic(() => import('./MobileAuthNav'), { ssr: false })

export default function MobileHeader() {
  const { open } = useSidebar()

  return (
    <header className="sticky top-0 z-40 md:hidden bg-black/80 backdrop-blur-sm border-b border-primary/20">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Hamburger button */}
        <button
          onClick={open}
          className="flex items-center justify-center h-10 w-10 hover:bg-primary/5 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo / Branding */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 border border-primary flex items-center justify-center">
            <div className="w-3 h-3 bg-primary/90" />
          </div>
          <span className="font-display font-bold text-sm tracking-widest uppercase">
            PARAMTUNE
          </span>
        </div>

        {/* Logout button or spacer to balance the header */}
        <MobileAuthNav />
      </div>
    </header>
  )
}
