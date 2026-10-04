import { useEffect, useSyncExternalStore } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import {
  applyThemeChoice,
  readThemeChoice,
  subscribeThemeChoice,
  type ThemeChoice,
} from '@/lib/theme'
import { cn } from '@/lib/utils'

const OPTIONS: { value: ThemeChoice; label: string; icon: typeof Moon }[] = [
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'light', label: 'Paper', icon: Sun },
  { value: 'system', label: 'System', icon: Monitor },
]

// Segmented control (§8 Tabs): surface-2 track, active surface-1 + strong border
export default function ThemeSwitcher({ className }: { className?: string }) {
  const choice = useSyncExternalStore(
    subscribeThemeChoice,
    readThemeChoice,
    () => 'dark' as ThemeChoice
  )

  // Follow the OS while "System" is selected
  useEffect(() => {
    if (choice !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => applyThemeChoice('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [choice])

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className={cn(
        'grid grid-cols-3 gap-0.5 rounded-sm border border-border bg-surface-2 p-0.5',
        className
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const checked = choice === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => applyThemeChoice(value)}
            className={cn(
              'flex items-center justify-center gap-1.5 h-7 rounded-xs border text-xs font-semibold transition-colors duration-150',
              checked
                ? 'border-border-strong bg-surface text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
