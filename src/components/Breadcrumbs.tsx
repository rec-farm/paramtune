import Link from 'next/link'

export type Crumb = {
  label: string
  href?: string
}

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2 min-w-0">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="inline-flex items-center min-h-8 text-muted-foreground hover:text-foreground transition-colors duration-150 truncate"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className="inline-flex items-center min-h-8 text-foreground truncate"
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
