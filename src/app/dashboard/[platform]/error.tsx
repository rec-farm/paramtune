'use client'

import Link from 'next/link'
import { AlertTriangle, RotateCw } from 'lucide-react'

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div role="alert" className="pt-card max-w-xl w-full p-8 space-y-6">
        <div className="space-y-2">
          <h2 className="pt-display text-lg flex items-center gap-3">
            <AlertTriangle
              className="w-5 h-5 text-danger shrink-0"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            Platform error
          </h2>
          <p className="text-sm text-muted-foreground">This platform failed to load.</p>
        </div>
        <p className="text-sm text-foreground border-l-2 border-danger bg-danger/10 px-4 py-3 break-words">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <p className="text-sm text-muted-foreground">
          Try again. If the problem persists, reload the page.
        </p>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="pt-btn pt-btn-primary">
            <RotateCw className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
            Retry
          </button>
          <Link href="/dashboard" className="pt-btn pt-btn-secondary">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
