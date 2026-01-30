export default function MockDashboard() {
  return (
    <div className="relative mx-auto max-w-4xl">
      {/* Browser chrome */}
      <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/50 border-b border-border">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-3 py-1 rounded-md bg-background/50 text-xs text-muted-foreground">
              localhost:3000/dashboard
            </div>
          </div>
          <div className="w-[54px]" /> {/* Spacer for symmetry */}
        </div>

        {/* Dashboard content */}
        <div className="flex min-h-[320px]">
          {/* Sidebar */}
          <div className="w-48 border-r border-border bg-muted/30 p-3 space-y-2">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-2 py-1">
              Platforms
            </div>
            {['ios-app', 'android-app', 'web-client'].map((name, i) => (
              <div
                key={name}
                className={`px-3 py-2 rounded-md text-sm ${
                  i === 0
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {name}
              </div>
            ))}
            <div className="px-3 py-2 rounded-md text-sm text-muted-foreground/50 border border-dashed border-border">
              + New platform
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">ios-app</h3>
                <p className="text-sm text-muted-foreground">
                  Schema v3 • Updated 2 hours ago
                </p>
              </div>
              <div className="flex gap-2">
                <div className="px-3 py-1.5 rounded-md bg-muted text-xs">
                  History
                </div>
                <div className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs">
                  Edit Schema
                </div>
              </div>
            </div>

            {/* JSON preview */}
            <div className="rounded-lg border border-border bg-background p-4 font-mono text-sm">
              <div className="text-muted-foreground">{'{'}</div>
              <div className="pl-4">
                <span className="text-blue-400">"feature_flags"</span>
                <span className="text-muted-foreground">: {'{'}</span>
              </div>
              <div className="pl-8">
                <span className="text-blue-400">"dark_mode"</span>
                <span className="text-muted-foreground">: </span>
                <span className="text-green-400">true</span>
                <span className="text-muted-foreground">,</span>
              </div>
              <div className="pl-8">
                <span className="text-blue-400">"new_checkout"</span>
                <span className="text-muted-foreground">: </span>
                <span className="text-yellow-400">false</span>
              </div>
              <div className="pl-4 text-muted-foreground">{'}'}</div>
              <div className="text-muted-foreground">{'}'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Glow effect */}
      <div className="absolute -inset-4 -z-10 bg-gradient-to-r from-primary/20 via-primary/5 to-primary/20 blur-3xl opacity-50" />
    </div>
  )
}
