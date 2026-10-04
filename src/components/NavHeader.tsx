import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import Logo from './Logo'

import AuthNav from './AuthNav'

const REPO_URL = 'https://github.com/RodrigoEspinosa/paramtune'

export default function NavHeader() {
  return (
    <header className="relative z-50 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between gap-4">
        <Logo asLink height={20} />

        <nav className="flex items-center gap-2 md:gap-6">
          <Link
            to="/api-docs"
            className="pt-label hidden sm:inline-flex items-center min-h-8 text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            API docs
          </Link>
          <Link
            to={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="pt-label hidden sm:inline-flex items-center gap-1 min-h-8 text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            GitHub
            <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
          </Link>

          <AuthNav />

          <Link to="/dashboard" className="pt-btn pt-btn-outline h-11 md:h-8 px-3">
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  )
}
