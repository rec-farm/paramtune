import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StatTile = {
  label: string
  value: number
  helper: string
  icon: LucideIcon
  tone?: 'neutral' | 'success' | 'warn'
}

// Dark status tiles are tints, not paint (§3.4): -950 tile, cream number, -400 icon
const TONE_CLASSES = {
  neutral: 'bg-surface',
  success: 'bg-success-tile',
  warn: 'bg-warn-tile',
} as const

const ICON_CLASSES = {
  neutral: 'text-muted-foreground',
  success: 'text-success-icon',
  warn: 'text-warn-icon',
} as const

// Bento placement: the first tile is the headline and takes the tall cell, the
// last one spans the bottom row, the rest sit beside the headline. Works for four.
function placement(index: number, count: number) {
  if (index === 0) return 'col-span-2 md:col-span-1 md:row-span-2'
  if (index === count - 1) return 'col-span-2'
  return ''
}

// Stat tile group (§8): joined tiles, 1px dividers, 1.5px strong outline,
// radius 0, large hard offset shadow. Status tiles always carry an icon.
export default function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <dl className="grid grid-cols-2 md:grid-cols-[2fr_1fr_1fr] gap-px bg-border border-[1.5px] border-border-strong shadow-hard-lg">
      {tiles.map(({ label, value, helper, icon: Icon, tone = 'neutral' }, index) => (
        <div
          key={label}
          className={cn(
            'flex flex-col justify-between gap-4 p-6 min-h-[136px] text-tile-foreground',
            TONE_CLASSES[tone],
            placement(index, tiles.length)
          )}
        >
          <dt className="flex items-start justify-between gap-2">
            <span className="pt-label text-muted-foreground">{label}</span>
            <Icon
              className={cn('h-5 w-5 shrink-0', ICON_CLASSES[tone])}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </dt>
          <dd className="space-y-2">
            <span
              className={cn(
                'pt-stat block',
                index === 0 ? 'text-[40px] md:text-[64px]' : 'text-[40px]'
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
