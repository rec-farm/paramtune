'use client'

import { memo, useMemo } from 'react'

interface VirtualizedLineNumbersProps {
  lineCount: number
  visibleStart: number
  visibleEnd: number
  lineHeight: number
  scrollTop: number
}

export const VirtualizedLineNumbers = memo(function VirtualizedLineNumbers({
  lineCount,
  visibleStart,
  visibleEnd,
  lineHeight,
  scrollTop,
}: VirtualizedLineNumbersProps) {
  const visibleLines = useMemo(() => {
    const lines = []
    const start = Math.max(0, visibleStart)
    const end = Math.min(visibleEnd, lineCount - 1)

    for (let i = start; i <= end; i++) {
      lines.push(
        <div
          key={i}
          style={{
            height: `${lineHeight}px`,
            lineHeight: `${lineHeight}px`,
            display: 'flex',
            alignItems: 'center',
            position: 'absolute',
            top: `${i * lineHeight}px`,
            left: '8px',
            right: '8px',
          }}
          className="text-xs text-gray-500 pointer-events-none select-none font-mono"
        >
          {i + 1}
        </div>
      )
    }
    return lines
  }, [lineCount, visibleStart, visibleEnd, lineHeight])

  return (
    <div
      className="absolute left-2 top-4 z-20 overflow-hidden"
      style={{
        height: `${lineCount * lineHeight}px`,
        width: '40px',
      }}
    >
      {visibleLines}
    </div>
  )
})
