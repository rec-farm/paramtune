'use client'

import Image from 'next/image'
import { ChevronDown, LogOut } from 'lucide-react'
import { signOut, useSession } from '@/lib/auth-client'
import { useState, useRef, useEffect } from 'react'

export default function UserMenu() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen((open) => {
          if (open) triggerRef.current?.focus()
          return false
        })
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  if (!session?.user) {
    return null
  }

  const user = session.user
  const initial = user.name?.charAt(0).toUpperCase() || '?'

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-11 md:h-10 px-1 text-muted-foreground hover:bg-surface-2 transition-colors duration-150"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={`Account menu for ${user.name ?? 'current user'}`}
      >
        {user.image ? (
          <Image
            src={user.image}
            alt=""
            width={32}
            height={32}
            unoptimized
            className="h-8 w-8 border border-border-strong"
          />
        ) : (
          <span className="h-8 w-8 flex items-center justify-center border border-border-strong bg-surface-2 text-sm font-bold text-foreground">
            {initial}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          strokeWidth={1.5}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 bg-popover border border-border-strong shadow-[var(--elev-raised)] z-50"
        >
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-bold text-foreground truncate">
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>

          <div className="py-1">
            <button
              role="menuitem"
              onClick={() => {
                setIsOpen(false)
                signOut()
              }}
              className="w-full flex items-center gap-3 h-10 px-4 text-sm text-foreground hover:bg-surface-3 transition-colors duration-150"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
