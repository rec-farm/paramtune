'use client'

import { AlertTriangle, RotateCw } from 'lucide-react'
import './globals.css'
import { PeggedDialArt } from '@/components/illustrations'

// Custom global error page to prevent Next.js auto-generated one
// from failing during static generation. It replaces the root layout,
// so it imports the global styles itself.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground font-mono">
        <div role="alert" className="pt-card max-w-md w-full p-8 space-y-6">
          <PeggedDialArt className="w-[200px] h-auto" />
          <h2 className="text-lg font-bold uppercase tracking-[0.08em] flex items-center gap-3">
            <AlertTriangle
              className="w-5 h-5 text-danger shrink-0"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            Something went wrong
          </h2>
          <p className="text-sm text-foreground border-l-2 border-danger bg-danger/10 px-4 py-3 break-words">
            {error.message || 'An unexpected error occurred.'}
          </p>
          <p className="text-sm text-muted-foreground">
            Try again. If the problem persists, reload the page.
          </p>
          <button type="button" onClick={() => reset()} className="pt-btn pt-btn-primary">
            <RotateCw className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
            Retry
          </button>
        </div>
      </body>
    </html>
  )
}
