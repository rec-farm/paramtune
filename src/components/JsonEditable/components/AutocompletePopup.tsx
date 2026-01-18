'use client'

import { forwardRef, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/components/ui/utils'
import type { AutocompletePopupProps, AutocompleteSuggestion } from '../types'

// Icons for different suggestion kinds
function KeyIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 text-blue-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
      />
    </svg>
  )
}

function ValueIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 text-green-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
      />
    </svg>
  )
}

function KeywordIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 text-purple-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
      />
    </svg>
  )
}

function SuggestionIcon({ kind }: { kind: AutocompleteSuggestion['kind'] }) {
  switch (kind) {
    case 'key':
      return <KeyIcon />
    case 'value':
      return <ValueIcon />
    case 'keyword':
      return <KeywordIcon />
    default:
      return <KeyIcon />
  }
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
          'bg-gray-800 rounded-lg shadow-xl',
          'border border-gray-700',
          'min-w-[200px] max-w-[300px]',
          'overflow-hidden',
          'animate-in fade-in-0 zoom-in-95 duration-100'
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
                'flex items-center gap-2 px-3 py-1.5 cursor-pointer',
                'text-sm text-gray-200',
                'transition-colors duration-75',
                index === selectedIndex
                  ? 'bg-blue-600 text-white'
                  : 'hover:bg-gray-700'
              )}
              onClick={() => handleItemClick(suggestion)}
            >
              <SuggestionIcon kind={suggestion.kind} />
              <span className="flex-1 truncate font-mono">
                {suggestion.label}
              </span>
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded',
                  index === selectedIndex
                    ? 'bg-blue-500 text-blue-100'
                    : 'bg-gray-700 text-gray-400'
                )}
              >
                {suggestion.kind}
              </span>
            </li>
          ))}
        </ul>

        {/* Keyboard hints */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-gray-700 bg-gray-850 text-xs text-gray-500">
          <span>
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-400 mr-1">
              ↑↓
            </kbd>
            navigate
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-400 mr-1">
              Enter
            </kbd>
            select
          </span>
          <span>
            <kbd className="px-1 py-0.5 bg-gray-700 rounded text-gray-400 mr-1">
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
