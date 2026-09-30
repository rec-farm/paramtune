import type { ButtonHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          'pt-btn',
          {
            'pt-btn-primary': variant === 'primary',
            'pt-btn-secondary': variant === 'secondary',
            'pt-btn-ghost': variant === 'ghost',
            'pt-btn-destructive': variant === 'destructive',
            'border-border-strong bg-transparent hover:bg-surface-2':
              variant === 'outline',
          },
          {
            'h-8 px-3 text-xs': size === 'sm',
            'h-10 px-4': size === 'md',
            'h-12 px-6': size === 'lg',
            'h-10 w-10 p-0': size === 'icon',
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
