import type { PropsWithChildren } from 'react'
import { cn } from './utils'

type BadgeProps = PropsWithChildren<{
  className?: string
}>

export default function Badge({ className, children }: BadgeProps) {
  return <span className={cn('badge', className)}>{children}</span>
}

