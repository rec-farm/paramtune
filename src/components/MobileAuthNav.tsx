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
    return <div className="w-10" /> // Spacer for layout balance
  }

  const user = session.user
  const initial = user.name?.charAt(0).toUpperCase() || '?'

  return (
    <div className="flex items-center gap-2">
      {/* Avatar */}
      {user.image ? (
        <Image
          src={user.image}
          alt=""
          width={32}
          height={32}
          unoptimized
          className="h-8 w-8 rounded-full border border-primary/20"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20">
          <span className="text-sm font-medium">{initial}</span>
        </div>
      )}

      {/* Logout button */}
      <button
        onClick={() => signOut()}
        className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-sidebar-foreground/10 transition-colors"
        aria-label="Sign out"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </div>
  )
}
