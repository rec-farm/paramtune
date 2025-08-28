import NavigationPlatforms from '@/components/NavigationPlatforms'

export default async function Sidebar() {
  return (
    <aside className="hidden md:block w-72 shrink-0">
      <div className="h-full bg-sidebar border-r border-sidebar-border">
        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <div className="h-2 w-2 rounded bg-primary" />
              </div>
              <h2 className="text-sm font-semibold tracking-wide text-sidebar-foreground/70">
                PLATFORMS
              </h2>
            </div>
            <div className="text-sm">
              <NavigationPlatforms />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                <div className="h-2 w-2 rounded bg-muted-foreground/60" />
              </div>
              <h2 className="text-sm font-semibold tracking-wide text-sidebar-foreground/70">
                RECENT
              </h2>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground px-2 py-1">
                No recent activity
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
