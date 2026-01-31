import Sidebar from '@/components/Sidebar'
import MobileHeader from '@/components/MobileHeader'
import { SidebarProvider } from '@/contexts/SidebarContext'
import Card from '@/components/ui/Card'
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
            <Card
              title="Cannot connect to Redis"
              subtitle="The dashboard is temporarily unavailable"
            >
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Paramtune could not reach the configured Redis instance. The
                  application UI is still running, but the dashboard requires
                  Redis for all read and write operations.
                </p>
                <p className="text-sm text-muted-foreground">
                  Please ensure your Redis server is running and reachable (for
                  example via <code>docker-compose up redis</code> or your
                  cloud Redis provider), then refresh this page.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <MobileHeader />
      <div className="flex min-h-screen">
        <Sidebar platforms={platforms} />
        <main className="flex-1 min-h-screen">
          <div className="p-4 md:p-6">
            <div className="animate-in">{children}</div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
