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
    <html lang="en" data-theme="dark" data-product="paramtune">
      <body className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground font-sans">
        <div role="alert" className="pt-card max-w-md w-full p-8 space-y-6">
          <PeggedDialArt className="w-[200px] h-auto" />
          <div>
            <p className="pt-eyebrow">Error</p>
            <h2 className="pt-title-2 mt-2">Something went wrong</h2>
          </div>
          <div className="flex gap-3 rounded-sm border border-border border-l-4 border-l-danger-icon bg-surface-2 px-5 py-4">
            <AlertTriangle
              className="w-4 h-4 mt-0.5 text-danger-icon shrink-0"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <p className="font-mono text-sm text-foreground break-words">
              {error.message || 'An unexpected error occurred.'}
            </p>
          </div>
          <p className="text-base text-muted-foreground">
            Try again. If it keeps happening, reload the page.
          </p>
          <button type="button" onClick={() => reset()} className="pt-btn pt-btn-primary">
            <RotateCw className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
