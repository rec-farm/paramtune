'use client'

import { memo, useMemo, useState, useEffect } from 'react'
import { highlightJsonVisibleLines, getTheme } from '../utils/optimizedSyntaxHighlighter'

interface SyntaxHighlightOverlayProps {
  jsonText: string
  visibleStart: number
  visibleEnd: number
  lineHeight: number
  scrollTop: number
  showLineNumbers: boolean
  theme?: 'light' | 'dark'
}

// Debounce delay for syntax highlighting (ms)
const HIGHLIGHT_DEBOUNCE_MS = 50

export const SyntaxHighlightOverlay = memo(function SyntaxHighlightOverlay({
  jsonText,
  visibleStart,
  visibleEnd,
  lineHeight,
  scrollTop,
  showLineNumbers,
  theme = 'dark',
}: SyntaxHighlightOverlayProps) {
  // Debounced text trails behind jsonText for smoother typing
  const [debouncedJsonText, setDebouncedJsonText] = useState(jsonText)

  // Debounce jsonText updates to avoid highlighting on every keystroke
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedJsonText(jsonText)
    }, HIGHLIGHT_DEBOUNCE_MS)

    return () => clearTimeout(timeoutId)
  }, [jsonText])

  const highlightedContent = useMemo(() => {
    const themeConfig = getTheme(theme)
    return highlightJsonVisibleLines(debouncedJsonText, visibleStart, visibleEnd, {}, themeConfig)
  }, [debouncedJsonText, visibleStart, visibleEnd, theme])

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
