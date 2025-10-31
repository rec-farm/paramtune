'use client'

import { memo, useCallback, useMemo, useState } from 'react'
import { useOptimizedJsonEditor } from './hooks/useOptimizedJsonEditor'
import { useTextareaRef } from './hooks/useTextareaRef'
import {
  createKeyboardHandlers,
  createKeyDownHandler,
} from './utils/keyboardHandlers'
import { ValidationStatus } from './components/ValidationStatus'
import { ActionButtons } from './components/ActionButtons'
import { ErrorDisplay } from './components/ErrorDisplay'
import { JsonTextarea } from './components/HighPerformanceTextarea'
import { SyntaxHighlightOverlay } from './components/VirtualizedSyntaxOverlay'
import { copyToClipboard, downloadAsJson } from '@/lib/fileUtils'
import type { JsonEditableProps } from './types'

const JsonEditable = memo(function JsonEditable({
  title,
  name,
  defaultValue,
  onValidationChange,
  className = '',
  placeholder = 'Enter valid JSON...',
  minHeight = 400,
  showLineNumbers = true,
  showActions = true,
  syntaxHighlighting = true,
  renderToolbar,
  showHeader = true,
}: JsonEditableProps) {
  const { state, actions } = useOptimizedJsonEditor({
    defaultValue,
    onValidationChange,
    validationDelay: 300, // Faster validation
  })

  const {
    textareaRef,
    setCursorPosition,
    insertTextAtCursor,
    getCurrentLineInfo,
  } = useTextareaRef()

  // Track scroll position for virtualization
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(minHeight)

  const keyboardHandlers = useMemo(
    () =>
      createKeyboardHandlers({
        insertTextAtCursor,
        setCursorPosition,
        getCurrentLineInfo,
        onTextChange: actions.setJsonText,
      }),
    [
      insertTextAtCursor,
      setCursorPosition,
      getCurrentLineInfo,
      actions.setJsonText,
    ]
  )

  const handleKeyDown = useMemo(
    () => createKeyDownHandler(keyboardHandlers),
    [keyboardHandlers]
  )

  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Use ResizeObserver for better resize detection
  const handleResize = useCallback(() => {
    if (textareaRef.current) {
      setContainerHeight(textareaRef.current.clientHeight)
    }
  }, [textareaRef])

  const handleCopy = useCallback(async () => {
    await copyToClipboard(state.jsonText)
  }, [state.jsonText])

  const handleDownload = useCallback(() => {
    downloadAsJson(state.jsonText, 'config.json')
  }, [state.jsonText])

  // Calculate visible lines for virtualization
  const lines = useMemo(() => state.jsonText.split('\n'), [state.jsonText])
  const lineCount = lines.length
  const lineHeight = 24
  const bufferLines = 5

  const visibleStart = Math.max(
    0,
    Math.floor(scrollTop / lineHeight) - bufferLines
  )
  const visibleEnd = Math.min(
    lineCount - 1,
    Math.ceil((scrollTop + containerHeight) / lineHeight) + bufferLines
  )

  // Extract error index from message like: "... at position 123"
  const errorIndex = useMemo(() => {
    if (!state.errorMessage) return null
    const match = state.errorMessage.match(/position\s(\d+)/)
    return match ? Number(match[1]) : null
  }, [state.errorMessage])

  // Map error index to zero-based line number
  const errorLine = useMemo(() => {
    if (errorIndex == null) return null
    const before = state.jsonText.slice(0, errorIndex)
    const line = before.split('\n').length - 1
    return line
  }, [errorIndex, state.jsonText])

  // Compute column (0-based) at error index
  const errorColumn = useMemo(() => {
    if (errorIndex == null) return null
    const before = state.jsonText.slice(0, errorIndex)
    const lastNl = before.lastIndexOf('\n')
    return lastNl === -1 ? before.length : before.length - lastNl - 1
  }, [errorIndex, state.jsonText])

  return (
    <div className={`space-y-4 animate-in ${className}`}>
      <input type="hidden" name={name} value={JSON.stringify(state.data)} />

      {/* Header / Toolbar */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ValidationStatus
              isValid={state.isValid}
              errorMessage={state.errorMessage}
            />
            {state.isDirty && (
              <div className="text-xs text-yellow-500">• Unsaved changes</div>
            )}
          </div>

          {renderToolbar ? (
            <div className="flex items-center gap-2">
              {renderToolbar({
                isValid: state.isValid,
                errorMessage: state.errorMessage,
                onFormat: actions.formatJson,
                onCopy: handleCopy,
                onDownload: handleDownload,
              })}
            </div>
          ) : (
            showActions && (
              <ActionButtons
                isValid={state.isValid}
                onFormat={actions.formatJson}
                onCopy={handleCopy}
                onDownload={handleDownload}
              />
            )
          )}
        </div>
      )}

      {/* JSON Editor */}
      <div className="space-y-2">
        <div className="relative bg-gray-900/20 rounded-lg overflow-hidden">
          <JsonTextarea
            ref={textareaRef}
            value={state.jsonText}
            onChange={actions.setJsonText}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            isValid={state.isValid}
            placeholder={placeholder}
            minHeight={minHeight}
            showLineNumbers={showLineNumbers}
            maskText={syntaxHighlighting}
          />

          {/* Error line highlight */}
          {!state.isValid &&
            errorLine != null &&
            errorLine >= visibleStart &&
            errorLine <= visibleEnd && (
              <div
                aria-hidden
                className="absolute inset-x-0 z-20"
                style={{
                  top: 16 + (errorLine - visibleStart) * lineHeight,
                  height: lineHeight,
                  background: 'rgba(239, 68, 68, 0.15)',
                  pointerEvents: 'none',
                }}
              />
            )}

          {/* Gutter marker on error line */}
          {!state.isValid &&
            showLineNumbers &&
            errorLine != null &&
            errorLine >= visibleStart &&
            errorLine <= visibleEnd && (
              <div
                aria-hidden
                className="absolute z-30"
                style={{
                  top:
                    16 +
                    (errorLine - visibleStart) * lineHeight +
                    lineHeight / 2 -
                    3,
                  left: 24,
                  width: 6,
                  height: 6,
                  borderRadius: 9999,
                  background: 'rgb(239, 68, 68)',
                  boxShadow: '0 0 0 2px rgba(239,68,68,0.25)',
                  pointerEvents: 'none',
                }}
              />
            )}

          {/* Inline underline at error column (approximate with ch units in monospace) */}
          {!state.isValid &&
            errorLine != null &&
            errorColumn != null &&
            errorLine >= visibleStart &&
            errorLine <= visibleEnd && (
              <div
                className="absolute z-30 group"
                style={{
                  top: 16 + (errorLine - visibleStart) * lineHeight,
                  left: `calc(${
                    showLineNumbers ? 48 : 16
                  }px + ${errorColumn}ch)`,
                  width: '1ch',
                  height: lineHeight,
                }}
              >
                {/* underline */}
                <div
                  aria-hidden
                  className="absolute"
                  style={{
                    bottom: 1,
                    left: 0,
                    width: '1ch',
                    height: 2,
                    background: 'rgb(239, 68, 68)',
                  }}
                />
                {/* tooltip */}
                <div
                  role="tooltip"
                  className="absolute block text-xs bg-red-600 text-white px-2 py-1 rounded shadow-lg whitespace-pre max-w-sm"
                  style={{
                    top: -28,
                    left: 0,
                  }}
                >
                  {state.errorMessage}
                </div>
              </div>
            )}

          {syntaxHighlighting && (
            <SyntaxHighlightOverlay
              jsonText={state.jsonText}
              visibleStart={visibleStart}
              visibleEnd={visibleEnd}
              lineHeight={lineHeight}
              scrollTop={scrollTop}
              showLineNumbers={showLineNumbers}
            />
          )}
        </div>

        <ErrorDisplay errorMessage={state.errorMessage} />
      </div>
    </div>
  )
})

export default JsonEditable
