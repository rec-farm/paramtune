'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import Logo from './Logo'
import Button from './ui/Button'
import { Github } from 'lucide-react'

// Dynamic import with ssr: false to avoid React context issues during static generation
const AuthNav = dynamic(() => import('./AuthNav'), { ssr: false })

export default function NavHeader() {
  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-5xl">
      <div className="border border-primary/30 bg-black/80 backdrop-blur-sm px-6 py-3 shadow-lg">
        <div className="flex items-center justify-between">
          <Logo asLink />

          <nav className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/api-docs"
              className="px-3 py-1.5 text-xs uppercase tracking-wider font-mono text-muted-foreground hover:text-primary transition-colors hover:bg-primary/5"
            >
              API Docs
            </Link>

            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wider font-mono text-muted-foreground hover:text-primary transition-colors hover:bg-primary/5"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </Link>

            <AuthNav />

            <Link href="/dashboard">
              <Button size="sm" className="uppercase tracking-wider">Dashboard</Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
