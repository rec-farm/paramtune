import React, { forwardRef } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'

type LogoVariant = 'lockup' | 'endorsed' | 'mark'

// Real REC logo files (BRAND.md §2.1): -cream on dark, -ink on Paper.
// Never set the wordmark in live text.
const FILES: Record<LogoVariant, { name: string; ratio: number }> = {
  lockup: { name: 'paramtune-lockup', ratio: 346 / 48 },
  endorsed: { name: 'paramtune-endorsed', ratio: 346 / 53 },
  mark: { name: 'paramtune-mark', ratio: 1 },
}

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  asLink?: boolean
  variant?: LogoVariant
  /** Rendered height in px. Lockup minimum is 96px wide (≈14px tall) */
  height?: number
  /** Force a colorway, e.g. cream on the deep-900 Paper sidebar */
  tone?: 'auto' | 'cream'
}

const Logo = forwardRef<HTMLDivElement, LogoProps>(
  (
    {
      className,
      asLink = false,
      variant = 'lockup',
      height = 20,
      tone = 'auto',
      ...props
    },
    ref
  ) => {
    const { name, ratio } = FILES[variant]
    const width = Math.round(height * ratio)
    const label = variant === 'endorsed' ? 'Paramtune by R.E.C.' : 'Paramtune'

    const content = (
      <div
        ref={ref}
        className={cn('flex items-center', className)}
        {...props}
      >
        <img
          src={`/brand/${name}-cream.svg`}
          alt={label}
          width={width}
          height={height}
          className={tone === 'auto' ? 'pt-on-dark' : undefined}
        />
        {tone === 'auto' && (
          <img
            src={`/brand/${name}-ink.svg`}
            alt={label}
            width={width}
            height={height}
            className="pt-on-paper"
          />
        )}
      </div>
    )

    if (asLink) {
      return (
        <Link
          to="/"
          aria-label="Paramtune home"
          className="inline-flex items-center min-h-8"
        >
          {content}
        </Link>
      )
    }

    return content
  }
)

Logo.displayName = 'Logo'

export default Logo
