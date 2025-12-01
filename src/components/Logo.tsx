import React, { forwardRef } from 'react'
import Link from 'next/link'
import { Stick } from 'next/font/google'
import { cn } from '@/components/ui/utils'

const stick = Stick({
  weight: '400',
  subsets: ['latin'],
})

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  asLink?: boolean
}

const Logo = forwardRef<HTMLDivElement, LogoProps>(
  ({ className, asLink = false, ...props }, ref) => {
    const content = (
      <div
        ref={ref}
        className={cn('flex items-center gap-2', className)}
        {...props}
      >
        <div className="h-9 w-9 rounded-2xl bg-black border border-[#ffff55]/80 shadow-[0_0_0_1px_rgba(0,0,0,0.85)] flex items-center justify-center">
          <span
            className={cn(
              stick.className,
              'text-[26px] leading-none text-[#ffff55] -mt-0.5 -rotate-3'
            )}
          >
            P
          </span>
        </div>
        <span className="font-semibold tracking-tight text-base sm:text-lg text-foreground">
          <span className="text-[#ffff55]">Param</span>
          Tune
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


