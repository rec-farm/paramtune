import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatTile = {
  label: string
  value: number
  helper: string
  icon: LucideIcon
  tone?: 'neutral' | 'success' | 'warn'
}

// Tints are translucent, so layer them over the opaque surface; otherwise the
// 1px grid gutter color shows through
const TONE_CLASSES = {
  neutral: 'bg-surface',
  success:
    'bg-surface bg-[linear-gradient(var(--pt-success-bg),var(--pt-success-bg))]',
  warn: 'bg-surface bg-[linear-gradient(var(--pt-warn-bg),var(--pt-warn-bg))]',
} as const

const ICON_CLASSES = {
  neutral: 'text-muted-foreground',
  success: 'text-success',
  warn: 'text-warn',
} as const

// Bento placement (DESIGN.md §6 Stat grid): the first tile is the headline and
// takes the tall cell, the last one spans the bottom row, the rest sit beside
// the headline. Works for four tiles.
function placement(index: number, count: number) {
  if (index === 0) return 'col-span-2 md:col-span-1 md:row-span-2 justify-between'
  if (index === count - 1) return 'col-span-2'
  return ''
}

// Workspace counts. Status tiles use a 10% tint and always carry an icon.
export default function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <dl className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr] border border-border bg-border gap-px">
      {tiles.map(({ label, value, helper, icon: Icon, tone = 'neutral' }, index) => (
        <div
          key={label}
          className={cn(
            'flex flex-col gap-3 p-4 md:p-6',
            TONE_CLASSES[tone],
            placement(index, tiles.length)
          )}
        >
          <dt className="flex items-center justify-between gap-2">
            <span className="pt-label text-muted-foreground">{label}</span>
            <Icon
              className={cn('h-4 w-4 shrink-0', ICON_CLASSES[tone])}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </dt>
          <dd className="space-y-1">
            <span
              className={cn(
                'block font-bold tabular-nums leading-none',
                index === 0 ? 'text-2xl md:text-4xl' : 'text-2xl'
              )}
            >
              {value}
            </span>
            <span className="block text-sm text-muted-foreground">{helper}</span>
          </dd>
        </div>
      ))}
    </dl>
  )
}
