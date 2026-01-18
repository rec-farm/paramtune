'use client'

import Link from 'next/link'
import Card from '@/components/ui/Card'

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="max-w-xl w-full">
        <Card
          title="Something went wrong"
          subtitle="An error occurred loading this platform"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <div className="flex gap-3">
              <button
                onClick={reset}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Try again
              </button>
              <Link
                href="/dashboard"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Back to dashboard
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
