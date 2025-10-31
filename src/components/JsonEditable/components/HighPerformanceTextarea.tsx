'use client'

import { memo, forwardRef, useCallback, useMemo, useState } from 'react'
import { VirtualizedLineNumbers } from './VirtualizedLineNumbers'

interface JsonTextareaProps {
  value: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onScroll?: (e: React.UIEvent<HTMLTextAreaElement>) => void
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
      isValid,
      placeholder = 'Enter valid JSON...',
      minHeight = 400,
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

    const textareaStyle = useMemo(
      () => ({
        minHeight: `${minHeight}px`,
        maxHeight: `${maxHeight}px`,
        lineHeight: `${LINE_HEIGHT}px`,
        tabSize: 2,
        fontFamily:
          'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
        color: maskText ? 'transparent' : '#E5E7EB',
        caretColor: '#E5E7EB',
        fontSize: '14px',
        paddingTop: '16px',
        paddingLeft: showLineNumbers ? '48px' : '16px',
        paddingRight: '16px',
        paddingBottom: '16px',
        outline: 'none',
        border: 'none',
        background: 'transparent',
        resize: 'vertical' as const,
      }),
      [minHeight, maxHeight, showLineNumbers, maskText]
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
