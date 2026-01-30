'use client'

import Link from 'next/link'
import Logo from './Logo'
import Button from './ui/Button'
import { Github } from 'lucide-react'

export default function NavHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-6xl flex h-14 items-center justify-between px-6">
        <Logo asLink />

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/api-docs"
            className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            API Docs
          </Link>

          <Link
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </Link>

          <Link href="/dashboard">
            <Button size="sm">Dashboard</Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
