'use client'

import Link from 'next/link'
import { AlertTriangle, RotateCw } from 'lucide-react'
import { PeggedDialArt } from '@/components/illustrations'

export default function VersionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div role="alert" className="pt-card max-w-xl w-full p-8 space-y-6">
        <PeggedDialArt className="w-[200px] h-auto" />
        <div>
          <p className="pt-eyebrow">Error</p>
          <h2 className="pt-title-2 mt-2">We couldn&apos;t load this schema</h2>
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
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="pt-btn pt-btn-primary">
            <RotateCw className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
            Try again
          </button>
          <Link href="/dashboard" className="pt-btn pt-btn-secondary">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
