'use client'

import { memo, useMemo, useState, useEffect, useRef } from 'react'
import { highlightVisibleLines, getTheme } from '../utils/optimizedSyntaxHighlighter'
import { sanitizeHtml } from '@/lib/sanitize'

interface SyntaxHighlightOverlayProps {
  visibleLines: string[]
  lineHeight: number
  scrollTop: number
  showLineNumbers: boolean
  theme?: 'light' | 'dark'
}

// Debounce delay for syntax highlighting (ms)
const HIGHLIGHT_DEBOUNCE_MS = 50

export const SyntaxHighlightOverlay = memo(function SyntaxHighlightOverlay({
  visibleLines,
  lineHeight,
  scrollTop,
  showLineNumbers,
  theme = 'dark',
}: SyntaxHighlightOverlayProps) {
  // Debounced lines trail behind visibleLines for smoother typing
  const [debouncedLines, setDebouncedLines] = useState(visibleLines)

  // Track previous visibleLines to detect changes
  const prevLinesRef = useRef(visibleLines)

  // Debounce visibleLines updates to avoid highlighting on every keystroke
  useEffect(() => {
    // Only debounce if lines actually changed
    if (prevLinesRef.current === visibleLines) return
    prevLinesRef.current = visibleLines

    const timeoutId = setTimeout(() => {
      setDebouncedLines(visibleLines)
    }, HIGHLIGHT_DEBOUNCE_MS)

    return () => clearTimeout(timeoutId)
  }, [visibleLines])

  const highlightedContent = useMemo(() => {
    const themeConfig = getTheme(theme)
    const highlighted = highlightVisibleLines(debouncedLines, {}, themeConfig)
    return sanitizeHtml(highlighted)
  }, [debouncedLines, theme])

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
