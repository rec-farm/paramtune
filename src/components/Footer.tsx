import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="relative border-t border-primary/20 mt-16">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <p className="text-xs text-muted-foreground max-w-xs font-mono">
              Opinionated configuration management for modern multi-platform apps.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground font-mono">
            <span className="opacity-70">
              © {new Date().getFullYear()} ParamTune
            </span>
            <span className="hidden md:inline opacity-50">•</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-primary transition-colors uppercase tracking-wider"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}


