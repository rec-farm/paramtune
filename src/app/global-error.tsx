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
        <div className="text-center p-8 max-w-md border border-[#D9F99D]/30 relative">
          <div className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-[#D9F99D]" />
          <h2 className="text-2xl font-bold mb-4 tracking-widest uppercase text-[#D9F99D]">
            SYSTEM_ERROR
          </h2>
          <p className="text-gray-400 mb-6 text-sm">
            {error.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => reset()}
            className="px-8 py-3 bg-[#D9F99D] text-black font-bold tracking-widest uppercase hover:translate-x-1 transition-transform"
          >
            RETRY
          </button>
        </div>
      </body>
    </html>
  )
}
