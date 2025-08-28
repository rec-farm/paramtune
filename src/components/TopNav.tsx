import Link from 'next/link'
import Button from './ui/Button'

export default function TopNav() {
  return (
    <header className="sticky top-0 z-50 glass border-b border-border/40">
      <div className="mx-auto max-w-7xl px-6">
        <div className="h-16 flex items-center justify-between">
          <Link href="/" className="group flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <div className="h-4 w-4 rounded bg-primary-foreground/90" />
            </div>
            <span className="font-bold text-xl tracking-tight gradient-text group-hover:scale-105 transition-transform duration-200">
              ParamTune
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                Home
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
