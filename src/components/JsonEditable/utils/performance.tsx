'use client'

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface VirtualizedLineNumbersProps {
  lineCount: number
  visibleStart: number
  visibleEnd: number
  lineHeight: number
}

export const VirtualizedLineNumbers = memo(function VirtualizedLineNumbers({
  lineCount,
  visibleStart,
  visibleEnd,
  lineHeight,
}: VirtualizedLineNumbersProps) {
  const visibleLines = useMemo(() => {
    const lines = []
    for (let i = visibleStart; i <= Math.min(visibleEnd, lineCount - 1); i++) {
      lines.push(
        <div
          key={i}
          style={{
            lineHeight: `${lineHeight}px`,
            height: `${lineHeight}px`,
          }}
          className="text-xs text-gray-500 pointer-events-none select-none"
        >
          {i + 1}
        </div>
      )
    }
    return lines
  }, [lineCount, visibleStart, visibleEnd, lineHeight])

  return <div className="absolute left-2 top-4 z-20">{visibleLines}</div>
})

interface VirtualizedTextareaProps {
  value: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  isValid: boolean
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  lineHeight?: number
}

export const VirtualizedTextarea = memo(function VirtualizedTextarea({
  value,
  onChange,
  onKeyDown,
  isValid,
  placeholder = 'Enter valid JSON...',
  minHeight = 400,
  maxHeight = 800,
  lineHeight = 24,
}: VirtualizedTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(minHeight)

  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const lines = value.split('\n')
  const totalHeight = lines.length * lineHeight
  const visibleStart = Math.floor(scrollTop / lineHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / lineHeight) + 1,
    lines.length - 1
  )

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        className={`w-full p-4 font-mono text-sm border-0 resize-y transition-colors bg-transparent relative z-10 ${
          !isValid
            ? 'focus:ring-2 focus:ring-red-500/50'
            : 'focus:ring-2 focus:ring-cyan-400/50'
        }`}
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: `${maxHeight}px`,
          lineHeight: `${lineHeight}px`,
          tabSize: 2,
          fontFamily:
            'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
          color: 'transparent',
          caretColor: '#E5E7EB',
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={handleScroll}
        placeholder={placeholder}
        spellCheck={false}
      />

      <VirtualizedLineNumbers
        lineCount={lines.length}
        visibleStart={visibleStart}
        visibleEnd={visibleEnd}
        lineHeight={lineHeight}
      />
    </div>
  )
})

interface DebouncedJsonEditorProps {
  value: string
  onChange: (value: string) => void
  delay?: number
}

export function useDebouncedValue(value: string, delay: number = 300): string {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 100
): T {
  const lastRun = useRef(Date.now())

  return useCallback(
    ((...args: Parameters<T>) => {
      if (Date.now() - lastRun.current >= delay) {
        callback(...args)
        lastRun.current = Date.now()
      }
    }) as T,
    [callback, delay]
  )
}
