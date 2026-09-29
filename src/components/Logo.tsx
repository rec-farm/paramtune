import React, { forwardRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  asLink?: boolean
}

const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ className, asLink = false, ...props }, ref) => {
    const content = (
      <div
        ref={ref}
        className={cn('flex items-center', className)}
        {...props}
      >
        <span className="pt-display text-base text-foreground">Paramtune</span>
      </div>
    )

    if (asLink) {
      return (
        <Link href="/" className="inline-flex items-center min-h-8">
          {content}
        </Link>
      )
    }

    return content
  }
)

Logo.displayName = 'Logo'

export default Logo
