import Sidebar from '@/components/Sidebar'
import DashboardTopBar from '@/components/DashboardTopBar'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { getPlatforms, type Platform } from '@/models/Platform'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { version } from '../../../package.json'

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
            <div role="alert" className="pt-card border-l-4 border-l-danger-icon p-6 space-y-4">
              <p className="pt-eyebrow">Connection</p>
              <h1 className="pt-title-2">We can&apos;t reach Redis</h1>
              <p className="text-muted-foreground">
                Paramtune couldn&apos;t connect to the configured Redis
                instance. The app is still running, but the dashboard needs
                Redis for every read and write.
              </p>
              <p className="text-muted-foreground">
                Make sure your Redis server is running and reachable (for
                example via{' '}
                <code className="pt-kbd text-foreground">
                  docker-compose up redis
                </code>{' '}
                or your cloud Redis provider), then retry.
              </p>
              {/* Full reload so this layout re-runs the Redis check */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/dashboard" className="pt-btn pt-btn-secondary">
                Retry connection
              </a>
            </div>
          </div>
        </div>
      </SidebarProvider>
    )
  }

  // App shell (§5.3): full-height sidebar left, top bar + content right
  return (
    <SidebarProvider>
      <div className="flex h-screen">
        <Sidebar platforms={platforms} version={version} />
        <div className="flex flex-1 min-w-0 flex-col">
          <DashboardTopBar />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8 xl:px-12">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
