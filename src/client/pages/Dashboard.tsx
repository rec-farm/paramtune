import { Outlet, useLoaderData } from 'react-router'
import type { DashboardData } from '@/client/router'
import Sidebar from '@/components/Sidebar'
import DashboardTopBar from '@/components/DashboardTopBar'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { version } from '../../../package.json'


export default function DashboardLayout() {
  const { platforms, redisAvailable, permissions } = useLoaderData() as DashboardData

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
        <Sidebar platforms={platforms} version={version} canManage={permissions.manage} />
        <div className="flex flex-1 min-w-0 flex-col">
          <DashboardTopBar />
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[1296px] px-4 py-6 md:px-8 md:py-8 xl:px-12">
              {!permissions.write && (
                <p role="status" className="pt-card mb-6 border-l-4 border-l-accent p-4 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">View only.</span> Your role can read configuration but not change it. Ask an administrator for editor access.
                </p>
              )}
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
