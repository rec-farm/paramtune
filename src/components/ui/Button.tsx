import { cn } from './utils'
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'ghost' | 'default'
  }
>

export default function Button({ variant = 'default', className, ...props }: ButtonProps) {
  const variantClass =
    variant === 'primary' ? 'btn btn-primary' : variant === 'ghost' ? 'btn btn-ghost' : 'btn border border-white/10 hover:bg-white/5'

  return <button {...props} className={cn(variantClass, className)} />
}

