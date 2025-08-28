import Link from 'next/link'

export default function TopNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/60 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4">
        <div className="h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight text-neutral-100">
            Remote Config
          </Link>

          <nav className="flex items-center gap-2">
            <Link className="btn btn-ghost h-9 px-3" href="/">Home</Link>
            <Link className="btn btn-primary h-9 px-3" href="/dashboard">Dashboard</Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

