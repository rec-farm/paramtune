import { forwardRef, useCallback, useEffect, useRef } from 'react'
import { Code, Hash, Key } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AutocompletePopupProps, AutocompleteSuggestion } from '../types'

const KIND_ICONS = {
  key: Key,
  value: Hash,
  keyword: Code,
} as const

function SuggestionIcon({ kind }: { kind: AutocompleteSuggestion['kind'] }) {
  const Icon = KIND_ICONS[kind] ?? Key
  return (
    <Icon
      className="w-4 h-4 shrink-0 text-muted-foreground"
      strokeWidth={1.5}
      aria-hidden="true"
    />
  )
}

const AutocompletePopup = forwardRef<HTMLDivElement, AutocompletePopupProps>(
  ({ suggestions, selectedIndex, onSelect, position, visible }, ref) => {
    const listRef = useRef<HTMLUListElement>(null)

    // Scroll selected item into view
    useEffect(() => {
      if (!listRef.current || selectedIndex < 0) return

      const list = listRef.current
      const selectedItem = list.children[selectedIndex] as HTMLElement
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' })
      }
    }, [selectedIndex])

    const handleItemClick = useCallback(
      (suggestion: AutocompleteSuggestion) => {
        onSelect(suggestion)
      },
      [onSelect]
    )

    if (!visible || suggestions.length === 0) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-50',
          'bg-popover shadow-pop',
          'rounded-md border-[1.5px] border-border-strong',
          'min-w-[200px] max-w-[300px]',
          'overflow-hidden'
        )}
        style={{
          top: position.top,
          left: position.left,
        }}
        role="listbox"
        aria-label="Autocomplete suggestions"
      >
        {/* Suggestions list */}
        <ul
          ref={listRef}
          className="max-h-[200px] overflow-y-auto py-1"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={`${suggestion.kind}-${suggestion.label}`}
              role="option"
              aria-selected={index === selectedIndex}
              className={cn(
                'flex items-center gap-2 h-8 px-3 cursor-pointer',
                'text-sm text-foreground',
                'transition-colors duration-150',
                index === selectedIndex
                  ? 'bg-surface-3 shadow-[inset_2px_0_0_var(--primary-bg)]'
                  : 'hover:bg-surface-3'
              )}
              onClick={() => handleItemClick(suggestion)}
            >
              <SuggestionIcon kind={suggestion.kind} />
              <span className="flex-1 truncate font-mono">
                {suggestion.label}
              </span>
              <span
                className={cn(
                  'text-xs px-1 border',
                  index === selectedIndex
                    ? 'border-border-strong text-foreground'
                    : 'border-border text-meta'
                )}
              >
                {suggestion.kind}
              </span>
            </li>
          ))}
        </ul>

        {/* Keyboard hints */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-border bg-surface text-xs text-meta">
          <span>
            <kbd className="pt-kbd text-muted-foreground mr-1">
              ↑↓
            </kbd>
            navigate
          </span>
          <span>
            <kbd className="pt-kbd text-muted-foreground mr-1">
              Enter
            </kbd>
            select
          </span>
          <span>
            <kbd className="pt-kbd text-muted-foreground mr-1">
              Esc
            </kbd>
            close
          </span>
        </div>
      </div>
    )
  }
)

AutocompletePopup.displayName = 'AutocompletePopup'

export { AutocompletePopup }
