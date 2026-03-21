import React, { forwardRef } from 'react'
import Link from 'next/link'
import { cn } from '@/components/ui/utils'

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  asLink?: boolean
}

const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ className, asLink = false, ...props }, ref) => {
    const content = (
      <div
        ref={ref}
        className={cn('flex items-center gap-3', className)}
        {...props}
      >
        <div className="w-8 h-8 border border-primary flex items-center justify-center">
          <span className="font-display text-primary text-xs font-bold">
            P
          </span>
        </div>
        <span className="font-display font-bold text-white tracking-widest text-base uppercase">
          PARAMTUNE
        </span>
      </div>
    )

    if (asLink) {
      return (
        <Link href="/" className="inline-flex items-center">
          {content}
        </Link>
      )
    }

    return content
  }
)

Logo.displayName = 'Logo'

export default Logo
