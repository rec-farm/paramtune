import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'
import NavHeader from '@/components/NavHeader'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { getPlatforms, type Platform } from '@/models/Platform'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

type PageProps = {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: PageProps) {
  // Defense-in-depth: validate session server-side (middleware is UX only)
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect('/login')
  }

  let platforms: Platform[] = []
  let redisAvailable = true

  try {
    platforms = await getPlatforms()
  } catch (error) {
    console.error('Failed to load platforms from Redis:', error)
    redisAvailable = false
  }

  if (!redisAvailable) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-xl w-full">
            <div role="alert" className="pt-card p-8 space-y-4">
              <h1 className="pt-display text-lg">Redis unavailable</h1>
              <p className="text-muted-foreground">
                Paramtune could not reach the configured Redis instance. The
                application UI is still running, but the dashboard requires
                Redis for all read and write operations.
              </p>
              <p className="text-muted-foreground">
                Make sure your Redis server is running and reachable (for
                example via{' '}
                <code className="px-1 border border-border bg-surface-2 text-foreground">
                  docker-compose up redis
                </code>{' '}
                or your cloud Redis provider), then retry.
              </p>
              {/* Full reload so this layout re-runs the Redis check */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/dashboard" className="pt-btn pt-btn-secondary">
                Retry
              </a>
            </div>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <div className="hidden md:flex flex-col h-screen">
        <div className="shrink-0 bg-background z-50">
          <NavHeader />
        </div>
        <div className="flex flex-1 min-h-0">
          <Sidebar platforms={platforms} />
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-8">{children}</div>
          </main>
        </div>
      </div>
      <div className="md:hidden">
        <MobileHeader />
        <div className="flex min-h-screen">
          <Sidebar platforms={platforms} />
          <main className="flex-1">
            <div className="p-4 md:p-8">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
