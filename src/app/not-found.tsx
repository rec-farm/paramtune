import Link from 'next/link'
import { NoMatchArt } from '@/components/illustrations'

// Custom 404 page
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground">
      <div className="pt-card max-w-md w-full p-8 space-y-6">
        <NoMatchArt className="w-full max-w-[300px] h-auto" />
        <div className="space-y-2">
          <p className="pt-label text-meta tabular-nums">404</p>
          <h1 className="pt-display text-lg">Page not found</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Nothing matches this address. The page doesn&apos;t exist or was
          moved.
        </p>
        <Link href="/" className="pt-btn pt-btn-primary">
          Go home
        </Link>
      </div>
    </div>
  )
}
