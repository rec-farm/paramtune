import type { ReactNode } from 'react'

type EmptyStateProps = {
  visual: ReactNode
  title: string
  description: ReactNode
  action?: ReactNode
}

// Empty data region: an illustration of what will live here, why it's empty,
// and the next action (DESIGN.md §6 States, §10 Illustration)
export default function EmptyState({
  visual,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-8">
      <div aria-hidden="true" className="select-none">
        {visual}
      </div>
      <div className="space-y-2 max-w-md">
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}
