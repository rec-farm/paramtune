'use client'

import Image from 'next/image'
import { LogOut } from 'lucide-react'
import { signOut, useSession } from '@/lib/auth-client'

// Mobile auth-aware navigation component
// Shows avatar + logout icon when logged in
// Dynamically imported with ssr: false to avoid React context issues during static generation
export default function MobileAuthNav() {
  const { data: session } = useSession()

  // Show nothing when not logged in (mobile header already has its own non-auth state)
  if (!session?.user) {
    return <div className="w-12" /> // Spacer for layout balance
  }

  const user = session.user
  const initial = user.name?.charAt(0).toUpperCase() || '?'

  return (
    <div className="flex items-center gap-2">
      {user.image ? (
        <Image
          src={user.image}
          alt=""
          width={32}
          height={32}
          unoptimized
          className="h-8 w-8 rounded-xs border border-border-strong"
        />
      ) : (
        <span
          className="h-8 w-8 flex items-center justify-center rounded-xs border border-border-strong bg-[var(--lilac-300)] text-sm font-bold text-[var(--ink-950)]"
          aria-hidden="true"
        >
          {initial}
        </span>
      )}

      <button
        onClick={() => signOut()}
        className="flex items-center justify-center h-11 w-11 rounded-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors duration-150"
        aria-label="Sign out"
      >
        <LogOut className="h-5 w-5" strokeWidth={1.5} />
      </button>
    </div>
  )
}
