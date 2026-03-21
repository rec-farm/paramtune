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
            <div className="border border-primary/30 bg-black/90 p-8 relative">
              <div className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-primary" />
              <div className="space-y-4">
                <h2 className="text-xl font-display font-bold tracking-widest uppercase text-primary">
                  REDIS_UNAVAILABLE
                </h2>
                <p className="text-[10px] text-gray-500 font-fragmented uppercase tracking-widest">
                  The dashboard is temporarily unavailable
                </p>
                <p className="text-sm text-gray-400 font-fragmented border-l-2 border-primary/30 pl-4">
                  Paramtune could not reach the configured Redis instance. The
                  application UI is still running, but the dashboard requires
                  Redis for all read and write operations.
                </p>
                <p className="text-sm text-gray-400 font-fragmented border-l-2 border-primary/30 pl-4">
                  Please ensure your Redis server is running and reachable (for
                  example via <code className="text-primary/80 bg-black/50 px-1 border border-primary/20">docker-compose up redis</code> or your
                  cloud Redis provider), then refresh this page.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <div className="hidden md:flex flex-col h-screen">
        <div className="shrink-0 bg-black/90 backdrop-blur-sm border-b border-primary/20 z-50">
          <NavHeader />
        </div>
        <div className="flex flex-1 min-h-0">
          <Sidebar platforms={platforms} />
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="animate-in">{children}</div>
            </div>
          </main>
        </div>
      </div>
      <div className="md:hidden">
        <MobileHeader />
        <div className="flex min-h-screen">
          <Sidebar platforms={platforms} />
          <main className="flex-1">
            <div className="p-4 md:p-6">
              <div className="animate-in">{children}</div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
