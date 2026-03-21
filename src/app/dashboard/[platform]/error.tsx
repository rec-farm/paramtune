'use client'

import Link from 'next/link'

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="max-w-xl w-full border border-primary/30 bg-black/90 p-8 relative">
        <div className="absolute -top-2 -right-2 w-4 h-4 border-t border-r border-primary" />
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-display font-bold tracking-widest uppercase text-primary mb-2">
              PLATFORM_ERROR
            </h2>
            <p className="text-[10px] text-gray-500 font-fragmented uppercase tracking-widest">
              An error occurred loading this platform
            </p>
          </div>
          <p className="text-sm text-gray-400 font-fragmented border-l-2 border-primary/30 pl-4">
            {error.message}
          </p>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="bg-primary text-black px-6 py-2 font-display font-bold text-[10px] tracking-widest uppercase hover:translate-x-1 transition-transform"
            >
              RETRY
            </button>
            <Link
              href="/dashboard"
              className="border border-primary/30 text-gray-400 px-6 py-2 font-display font-bold text-[10px] tracking-widest uppercase hover:text-white hover:border-primary/50 transition-colors"
            >
              BACK_TO_DASHBOARD
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
