import type { PropsWithChildren } from 'react'
import { cn } from './utils'

type CardProps = PropsWithChildren<{
  className?: string
  title?: string
  actions?: React.ReactNode
}>

export default function Card({ className, title, actions, children }: CardProps) {
  return (
    <div className={cn('card p-4', className)}>
      {(title || actions) && (
        <div className="mb-3 flex items-center justify-between">
          {title && <h3 className="text-sm font-semibold text-neutral-300">{title}</h3>}
          {actions}
        </div>
      )}
      {children}
    </div>
  )
}

