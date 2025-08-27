import Link from 'next/link'
export default function Home() {
  return (
    <main className="">
      <div className="p-10 text-center">
        <h1 className="text-5xl font-mono font-bold mb-4">Remote Config</h1>
        <p className="text-slate-400 mb-6">
          Manage platform schemas and versions. Head to the dashboard to begin.
        </p>
        <Link href="/dashboard" className="inline-block px-4 py-2 border-2 border-white rounded">
          Open Dashboard
        </Link>
      </div>
    </main>
  )
}
