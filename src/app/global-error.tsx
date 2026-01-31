'use client'

// Custom global error page to prevent Next.js auto-generated one
// from failing during static generation
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
          <p className="text-gray-400 mb-6">
            {error.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => reset()}
            className="px-6 py-2 bg-yellow-400 text-black font-medium rounded hover:bg-yellow-300 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
