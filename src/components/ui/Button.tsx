import type { ButtonHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from './utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'btn',
          {
            'btn-primary': variant === 'primary',
            'btn-secondary': variant === 'secondary',
            'btn-ghost': variant === 'ghost',
            'btn-destructive': variant === 'destructive',
            'border border-border bg-background hover:bg-accent hover:text-accent-foreground':
              variant === 'outline',
          },
          {
            'h-8 px-3 text-xs': size === 'sm',
            'h-9 px-4': size === 'md',
            'h-10 px-6 text-base': size === 'lg',
            'h-9 w-9 p-0': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export default Button
