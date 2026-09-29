import Link from 'next/link'

const REPO_URL = 'https://github.com/RodrigoEspinosa/paramtune'

const linkClass =
  'inline-flex items-center min-h-8 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150'

export default function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-6 space-y-4">
          <span className="pt-display text-base text-foreground">Paramtune</span>
          <p className="text-sm text-muted-foreground max-w-[68ch]">
            Self-hosted, API-first configuration management. Open source.
          </p>
        </div>

        <div className="md:col-span-6 flex flex-wrap md:justify-end gap-x-16 gap-y-8">
          <div className="flex flex-col gap-2">
            <span className="pt-label text-meta">Documentation</span>
            <Link href="#quickstart" className={linkClass}>
              Quick start
            </Link>
            <Link href="/api-docs" className={linkClass}>
              API reference
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="pt-label text-meta">Project</span>
            <Link
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              GitHub
            </Link>
            <Link
              href={`${REPO_URL}/blob/master/LICENSE`}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              License
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
