'use client'

import { LogOut } from 'lucide-react'
import { signOut, useSession } from '@/lib/auth-client'

// Mobile auth-aware navigation component for logout functionality
// Dynamically imported with ssr: false to avoid React context issues during static generation
export default function MobileAuthNav() {
  const { data: session } = useSession()

  // Show spacer when not logged in to maintain header balance
  if (!session?.user) {
    return <div className="w-10" />
  }

  return (
    <button
      onClick={() => signOut()}
      className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-sidebar-foreground/10 transition-colors"
      aria-label="Sign out"
    >
      <LogOut className="h-5 w-5" />
    </button>
  )
}
