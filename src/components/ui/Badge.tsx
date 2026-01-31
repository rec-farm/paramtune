import type { HTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from './utils'

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center border px-2.5 py-0.5 text-xs font-mono font-medium uppercase tracking-wide transition-colors focus:outline-none focus:ring-1 focus:ring-primary/50',
          {
            'border-primary/50 bg-primary text-primary-foreground hover:bg-primary/80':
              variant === 'default',
            'border-primary/30 bg-black/50 text-secondary-foreground hover:bg-black/70':
              variant === 'secondary',
            'border-destructive/50 bg-destructive text-destructive-foreground hover:bg-destructive/80':
              variant === 'destructive',
            'border-primary/30 text-foreground': variant === 'outline',
            'border-green-500/50 bg-green-500 text-white hover:bg-green-600':
              variant === 'success',
            'border-yellow-500/50 bg-yellow-500 text-black hover:bg-yellow-600':
              variant === 'warning',
          },
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = 'Badge'

export default Badge
