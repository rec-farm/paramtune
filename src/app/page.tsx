import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function Home() {
  return (
    <main className="relative">
      <div className="pointer-events-none absolute inset-0 bg-grid" />
      <section className="relative mx-auto max-w-5xl px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight mb-4">
            Remote Config
          </h1>
          <p className="text-neutral-400 text-lg">
            Manage platform schemas and versions with a fast, elegant interface.
          </p>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/dashboard">
            <Button variant="primary" className="h-10 px-5">Open Dashboard</Button>
          </Link>
          <a className="btn btn-ghost h-10 px-5" href="https://vercel.com" target="_blank" rel="noreferrer">
            Learn more
          </a>
        </div>
      </section>

      <section className="relative mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card p-4">
            <div className="text-sm font-semibold mb-1">Schema Editing</div>
            <p className="text-neutral-400 text-sm">Edit JSON schemas with live preview and safe updates.</p>
          </div>
          <div className="card p-4">
            <div className="text-sm font-semibold mb-1">Versioning</div>
            <p className="text-neutral-400 text-sm">Track and manage platform versions with badges.</p>
          </div>
          <div className="card p-4">
            <div className="text-sm font-semibold mb-1">APIs</div>
            <p className="text-neutral-400 text-sm">Access schemas via streamlined API routes.</p>
          </div>
          <div className="card p-4">
            <div className="text-sm font-semibold mb-1">Dark UI</div>
            <p className="text-neutral-400 text-sm">Minimal, accessible, Vercel-inspired interface.</p>
          </div>
          <div className="card p-4">
            <div className="text-sm font-semibold mb-1">Keyboard First</div>
            <p className="text-neutral-400 text-sm">Fast flows, clear focus states and shortcuts.</p>
          </div>
          <div className="card p-4">
            <div className="text-sm font-semibold mb-1">Extensible</div>
            <p className="text-neutral-400 text-sm">Composable components for rapid customization.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link className="btn btn-primary h-10 px-5" href="/dashboard">Get started</Link>
          <Link className="btn btn-ghost h-10 px-5" href="/dashboard">View platforms</Link>
        </div>
      </section>
    </main>
  )
}
