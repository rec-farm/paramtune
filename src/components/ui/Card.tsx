import type { HTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      title,
      subtitle,
      actions,
      children,
      variant = 'default',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'card p-6 animate-in',
          {
            'card-elevated': variant === 'elevated',
            'border-2': variant === 'outlined',
            'card-interactive': variant === 'interactive',
          },
          className
        )}
        {...props}
      >
        {(title || subtitle || actions) && (
          <div className="mb-6 space-y-1.5">
            <div className="flex items-center justify-between">
              {(title || subtitle) && (
                <div className="space-y-1">
                  {title && (
                    <h3 className="text-sm font-display font-bold uppercase tracking-widest text-foreground">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-xs text-gray-500 font-fragmented">{subtitle}</p>
                  )}
                </div>
              )}
              {actions && (
                <div className="flex items-center gap-2">{actions}</div>
              )}
            </div>
          </div>
        )}
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-sm font-display font-bold uppercase tracking-widest',
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export default Card
