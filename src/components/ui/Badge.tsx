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
          // Tag (§8): 22px mono, radius 2, status tile + status text
          'inline-flex items-center gap-1 h-[22px] rounded-xs border px-1.5 font-mono text-[11px] font-semibold',
          {
            'border-transparent bg-primary-soft text-link': variant === 'default',
            'border-border bg-surface-2 text-foreground':
              variant === 'secondary',
            'border-transparent bg-danger-soft text-danger':
              variant === 'destructive',
            'border-border-strong text-foreground': variant === 'outline',
            'border-transparent bg-success-soft text-success':
              variant === 'success',
            'border-transparent bg-warn-soft text-warn': variant === 'warning',
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
