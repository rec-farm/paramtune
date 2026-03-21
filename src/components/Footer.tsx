import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="relative z-50 pt-24 pb-12 border-t border-primary/10 mt-24">
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 text-gray-500">
        <div className="md:col-span-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 border border-primary flex items-center justify-center font-display text-primary text-xs">
              P
            </div>
            <span className="font-display font-bold text-white tracking-widest text-lg">
              PARAMTUNE
            </span>
          </div>
          <p className="text-[10px] uppercase tracking-widest leading-loose font-fragmented">
            Centralized Architecture for modern systems.
            <br />
            Self-hosted. API-First. Open Source.
            <br />
            &copy; {new Date().getFullYear()} SYSTEM_CORE_V1.0
          </p>
        </div>

        <div className="md:col-span-8 flex flex-wrap justify-end gap-x-16 gap-y-8">
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold text-primary tracking-widest font-display">
              _DOCUMENTATION
            </span>
            <Link
              href="#quickstart"
              className="text-xs hover:text-white transition-colors font-fragmented"
            >
              Quick Start
            </Link>
            <Link
              href="/api-docs"
              className="text-xs hover:text-white transition-colors font-fragmented"
            >
              API Reference
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold text-primary tracking-widest font-display">
              _LEGAL
            </span>
            <span className="text-xs font-fragmented">Privacy Policy</span>
            <span className="text-xs font-fragmented">
              Open Source License
            </span>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-bold text-primary tracking-widest font-display">
              _SOCIAL
            </span>
            <Link
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs hover:text-white transition-colors font-fragmented"
            >
              GitHub
            </Link>
            <span className="text-xs font-fragmented">Discord</span>
            <span className="text-xs font-fragmented">X / Twitter</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6">
        <div className="mt-12 h-1 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      </div>
    </footer>
  )
}
