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
            'pt-btn-outline': variant === 'outline',
          },
          {
            'h-7 px-2.5 text-[13px]': size === 'sm',
            'h-9 px-3.5': size === 'md',
            'h-11 px-[18px] text-[15px]': size === 'lg',
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
