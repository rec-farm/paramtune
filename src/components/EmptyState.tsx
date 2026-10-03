import type { ReactNode } from 'react'

type EmptyStateProps = {
  visual: ReactNode
  title: string
  description: ReactNode
  action?: ReactNode
}

// Empty state (§8): illustration → title-2 with the purple period → one-line
// benefit → one action. Centered, 64px padding, text max 420px.
export default function EmptyState({
  visual,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center gap-6 px-6 py-16">
      <div aria-hidden="true" className="select-none">
        {visual}
      </div>
      <div className="space-y-2 max-w-[420px]">
        <h3 className="pt-title-2">
          {title}
          <span className="pt-period">.</span>
        </h3>
        <p className="text-base text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  )
}
