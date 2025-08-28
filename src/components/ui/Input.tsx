import type { InputHTMLAttributes } from 'react'
import { cn } from './utils'

type InputProps = InputHTMLAttributes<HTMLInputElement>

export default function Input({ className, ...props }: InputProps) {
  return <input {...props} className={cn('input', className)} />
}

