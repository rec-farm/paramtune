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
    </main>
  )
}
