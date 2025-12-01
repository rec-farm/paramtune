import Logo from './Logo'

export default function Footer() {
  return (
    <footer className="border-t border-border/40 bg-black/60">
      <div className="mx-auto max-w-6xl px-6 py-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Logo />
          <p className="text-xs text-muted-foreground">
            Opinionated configuration management for modern multi-platform apps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="opacity-80">
            © {new Date().getFullYear()} ParamTune. All rights reserved.
          </span>
          <span className="hidden md:inline">•</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-primary transition-colors"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </footer>
  )
}


