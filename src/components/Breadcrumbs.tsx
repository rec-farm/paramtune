import { Link } from 'react-router'
import { cn } from '@/lib/utils'

export type Crumb = {
  label: string
  href?: string
  /** Identifiers (platform, version) render in mono */
  mono?: boolean
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-2 text-sm min-w-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2 min-w-0">
              {item.href && !isLast ? (
                <Link
                  to={item.href}
                  className={cn(
                    'inline-flex items-center min-h-8 text-muted-foreground hover:text-foreground transition-colors duration-150 truncate',
                    item.mono && 'font-mono'
                  )}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center min-h-8 text-foreground truncate',
                    item.mono && 'font-mono'
                  )}
                >
                  {item.label}
                </span>
              )}
              {!isLast && (
                <span className="text-meta" aria-hidden="true">
                  /
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
