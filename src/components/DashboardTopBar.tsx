import { Link } from 'react-router'
import { useLocation } from 'react-router'
import { ArrowUpRight, Menu } from 'lucide-react'
import Breadcrumbs, { type Crumb } from '@/components/Breadcrumbs'
import { useSidebar } from '@/contexts/SidebarContext'

import AuthNav from './AuthNav'

const REPO_URL = 'https://github.com/rec-farm/paramtune'

// Breadcrumb trail for each dashboard route (§10.4)
function crumbsFor(pathname: string): Crumb[] {
  const workspace: Crumb = { label: 'Workspace', href: '/dashboard' }
  const segments = pathname
    .replace(/^\/dashboard\/?/, '')
    .split('/')
    .filter(Boolean)
    .map(decodeURIComponent)

  if (segments.length === 0) return [workspace, { label: 'Overview' }]
  if (segments[0] === 'compare') return [workspace, { label: 'Compare schemas' }]

  const [platform, version] = segments
  return [
    { label: 'Platforms', href: '/dashboard' },
    {
      label: platform,
      href: `/dashboard/${encodeURIComponent(platform)}`,
      mono: true,
    },
    ...(version ? [{ label: `v${version}`, mono: true }] : []),
  ]
}

// App shell top bar (§5.3, §10.4): breadcrumb left, utility links + user right.
// The wordmark lives in the sidebar, so it is not repeated here.
export default function DashboardTopBar() {
  const { open } = useSidebar()
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-30 shrink-0 h-14 bg-background border-b border-border">
      <div className="h-full flex items-center justify-between gap-4 px-2 md:px-8 xl:px-12">
        <div className="flex items-center gap-1 min-w-0">
          <button
            onClick={open}
            className="md:hidden flex items-center justify-center h-11 w-11 shrink-0 rounded-sm text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors duration-150"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.5} />
          </button>
          <Breadcrumbs items={crumbsFor(pathname)} />
        </div>

        <nav aria-label="Utility" className="flex items-center gap-2 md:gap-6 shrink-0">
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
        </nav>
      </div>
    </header>
  )
}
