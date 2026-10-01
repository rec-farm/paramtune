import Link from 'next/link'
import { NoMatchArt } from '@/components/illustrations'

// Custom 404 page
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background text-foreground">
      <div className="pt-card max-w-md w-full p-8 space-y-6">
        <NoMatchArt className="w-full max-w-[300px] h-auto" />
        <div>
          <p className="pt-eyebrow">Error 404</p>
          <h1 className="pt-title-2 mt-2">
            Nothing to tune here<span className="pt-period">.</span>
          </h1>
        </div>
        <p className="text-base text-muted-foreground">
          This page doesn&apos;t exist, or it moved. Head home and pick up from
          there.
        </p>
        <Link href="/" className="pt-btn pt-btn-primary">
          Go home
        </Link>
      </div>
    </div>
  )
}
