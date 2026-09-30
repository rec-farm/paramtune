'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'

const AuthNav = dynamic(() => import('./AuthNav'), { ssr: false })

const REPO_URL = 'https://github.com/RodrigoEspinosa/paramtune'

export default function NavHeader() {
  return (
    <header className="relative z-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="pt-display text-base text-foreground inline-flex items-center min-h-8"
        >
          Paramtune
        </Link>

        <nav className="flex items-center gap-2 md:gap-6">
          <Link
            href="/api-docs"
            className="pt-label hidden sm:inline-flex items-center min-h-8 text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            API docs
          </Link>
          <Link
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pt-label hidden sm:inline-flex items-center gap-1 min-h-8 text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            GitHub
            <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          </Link>

          <AuthNav />

          <Link href="/dashboard" className="pt-btn pt-btn-secondary h-11 md:h-8 px-3 text-xs">
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  )
}
