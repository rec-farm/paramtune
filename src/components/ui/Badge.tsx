import type { HTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

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
          'inline-flex items-center gap-1 border px-2 py-0.5 text-xs font-mono font-bold uppercase tracking-[0.08em]',
          {
            'border-primary text-primary':
              variant === 'default',
            'border-border-strong bg-surface-2 text-foreground':
              variant === 'secondary',
            'border-danger/40 bg-danger/10 text-danger':
              variant === 'destructive',
            'border-border-strong text-foreground': variant === 'outline',
            'border-success/40 bg-success/10 text-success':
              variant === 'success',
            'border-warn/40 bg-warn/10 text-warn':
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
