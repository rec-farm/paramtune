import Link from 'next/link'

// Custom 404 page
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center p-8 max-w-md">
        <h2 className="text-4xl font-bold mb-4 text-yellow-400">404</h2>
        <p className="text-xl mb-2">Page not found</p>
        <p className="text-gray-400 mb-6">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-yellow-400 text-black font-medium rounded hover:bg-yellow-300 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
