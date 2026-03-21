'use client'

import { ChevronDown, LogOut } from 'lucide-react'
import { signOut, useSession } from '@/lib/auth-client'
import { useState, useRef, useEffect } from 'react'

export default function UserMenu() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!session?.user) {
    return null
  }

  const user = session.user
  const initial = user.name?.charAt(0).toUpperCase() || '?'

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-primary/5 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        {user.image ? (
          <img
            src={user.image}
            alt=""
            className="h-7 w-7 rounded-full border border-primary/20"
          />
        ) : (
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
            <span className="text-xs font-medium">{initial}</span>
          </div>
        )}
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-black/95 border border-primary/20 shadow-lg shadow-black/50 z-50 animate-in">
          {/* User info section */}
          <div className="px-4 py-3 border-b border-primary/10">
            <p className="text-sm font-display font-bold text-foreground truncate tracking-wider uppercase">
              {user.name}
            </p>
            <p className="text-[10px] text-gray-500 truncate font-fragmented">
              {user.email}
            </p>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false)
                signOut()
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
