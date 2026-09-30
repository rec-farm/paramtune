'use client'

import { memo, forwardRef, useCallback, useMemo, useState } from 'react'
import { VirtualizedLineNumbers } from './VirtualizedLineNumbers'
import { EDITOR_CONSTANTS } from '../utils/editorConstants'

interface JsonTextareaProps {
  value: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onScroll?: (e: React.UIEvent<HTMLTextAreaElement>) => void
  onSelect?: () => void
  isValid: boolean
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  showLineNumbers?: boolean
  maskText?: boolean
}

const LINE_HEIGHT = 24
const BUFFER_LINES = 5 // Extra lines to render above/below visible area

export const JsonTextarea = memo(
  forwardRef<HTMLTextAreaElement, JsonTextareaProps>(function JsonTextarea(
    {
      value,
      onChange,
      onKeyDown,
      onScroll,
      onSelect,
      isValid,
      placeholder = 'Enter valid JSON...',
      minHeight = 80,
      maxHeight = 800,
      showLineNumbers = true,
      maskText = true,
    },
    ref
  ) {
    const [scrollTop, setScrollTop] = useState(0)
    const [containerHeight, setContainerHeight] = useState(minHeight)

    const lines = useMemo(() => value.split('\n'), [value])
    const lineCount = lines.length

    const handleScroll = useCallback(
      (e: React.UIEvent<HTMLTextAreaElement>) => {
        setScrollTop(e.currentTarget.scrollTop)
        onScroll?.(e)
      },
      [onScroll]
    )

    // Use ResizeObserver for better resize detection
    const handleResize = useCallback(() => {
      if (ref && 'current' in ref && ref.current) {
        setContainerHeight(ref.current.clientHeight)
      }
    }, [ref])

    // Calculate visible lines with buffer
    const visibleStart = Math.max(
      0,
      Math.floor(scrollTop / LINE_HEIGHT) - BUFFER_LINES
    )
    const visibleEnd = Math.min(
      lineCount - 1,
      Math.ceil((scrollTop + containerHeight) / LINE_HEIGHT) + BUFFER_LINES
    )

    // Auto-size: compute height from content, clamped between min and max
    const contentHeight = lineCount * LINE_HEIGHT + 32 // 16px padding top + bottom
    const computedHeight = Math.max(minHeight, Math.min(maxHeight, contentHeight))

    const textareaStyle = useMemo(
      () => ({
        height: `${computedHeight}px`,
        maxHeight: `${maxHeight}px`,
        lineHeight: `${LINE_HEIGHT}px`,
        tabSize: 2,
        fontFamily: EDITOR_CONSTANTS.FONT_FAMILY,
        color: maskText ? 'transparent' : 'var(--pt-fg)',
        caretColor: 'var(--pt-fg)',
        fontSize: `${EDITOR_CONSTANTS.FONT_SIZE}px`,
        paddingTop: '16px',
        paddingLeft: showLineNumbers ? '48px' : '16px',
        paddingRight: '16px',
        paddingBottom: '16px',
        outline: 'none',
        border: 'none',
        background: 'transparent',
        resize: 'none' as const,
      }),
      [computedHeight, maxHeight, showLineNumbers, maskText]
    )

    return (
      <div className="relative">
        <textarea
          ref={ref}
          className={`w-full font-mono text-sm transition-colors relative z-10`}
          style={textareaStyle}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          onScroll={handleScroll}
          onSelect={onSelect}
          onClick={onSelect}
          placeholder={placeholder}
          spellCheck={false}
        />

        {showLineNumbers && (
          <VirtualizedLineNumbers
            lineCount={lineCount}
            visibleStart={visibleStart}
            visibleEnd={visibleEnd}
            lineHeight={LINE_HEIGHT}
            scrollTop={scrollTop}
          />
        )}
      </div>
    )
  })
)
