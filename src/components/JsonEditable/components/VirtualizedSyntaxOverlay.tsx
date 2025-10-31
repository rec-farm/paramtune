'use client'

import { memo, useMemo } from 'react'
import { highlightJsonVisibleLines } from '../utils/optimizedSyntaxHighlighter'

interface SyntaxHighlightOverlayProps {
  jsonText: string
  visibleStart: number
  visibleEnd: number
  lineHeight: number
  scrollTop: number
  showLineNumbers: boolean
}

export const SyntaxHighlightOverlay = memo(function SyntaxHighlightOverlay({
  jsonText,
  visibleStart,
  visibleEnd,
  lineHeight,
  scrollTop,
  showLineNumbers,
}: SyntaxHighlightOverlayProps) {
  const highlightedContent = useMemo(() => {
    return highlightJsonVisibleLines(jsonText, visibleStart, visibleEnd)
  }, [jsonText, visibleStart, visibleEnd])

  const overlayStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none' as const,
      overflow: 'hidden',
      lineHeight: `${lineHeight}px`,
      fontSize: '14px',
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
      whiteSpace: 'pre-wrap' as const,
      wordWrap: 'break-word' as const,
      paddingTop: '16px',
      paddingLeft: showLineNumbers ? '48px' : '16px',
      paddingRight: '16px',
      paddingBottom: '16px',
    }),
    [lineHeight, showLineNumbers]
  )

  return (
    <div
      style={overlayStyle}
      dangerouslySetInnerHTML={{
        __html: highlightedContent,
      }}
    />
  )
})
