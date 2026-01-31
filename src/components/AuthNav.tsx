'use client'

import { signOut, useSession } from '@/lib/auth-client'

// Auth-aware navigation component for logout functionality
// Dynamically imported with ssr: false to avoid React context issues during static generation
export default function AuthNav() {
  const { data: session } = useSession()

  if (!session?.user) {
    return null
  }

  return (
    <button
      onClick={() => signOut()}
      className="px-3 py-1.5 text-xs uppercase tracking-wider font-mono text-muted-foreground hover:text-primary transition-colors hover:bg-primary/5"
    >
      Sign out
    </button>
  )
}
