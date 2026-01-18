'use client'

import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useOptimizedJsonEditor } from './hooks/useOptimizedJsonEditor'
import { useTextareaRef } from './hooks/useTextareaRef'
import { useAutocomplete } from './hooks/useAutocomplete'
import {
  createKeyboardHandlers,
  createAutocompleteKeyDownHandler,
} from './utils/keyboardHandlers'
import { getAutocompleteContext } from './utils/autocomplete'
import { ValidationStatus } from './components/ValidationStatus'
import { ActionButtons } from './components/ActionButtons'
import { ErrorDisplay } from './components/ErrorDisplay'
import { AutocompletePopup } from './components/AutocompletePopup'
import { JsonTextarea } from './components/HighPerformanceTextarea'
import { SyntaxHighlightOverlay } from './components/VirtualizedSyntaxOverlay'
import { copyToClipboard, downloadAsJson } from '@/lib/fileUtils'
import type { JsonEditableProps, AutocompleteSuggestion } from './types'

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
  theme = 'dark',
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

  // Autocomplete hook
  const autocomplete = useAutocomplete()

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

  // Handle accepting an autocomplete suggestion
  const handleAcceptSuggestion = useCallback(
    (suggestion: AutocompleteSuggestion) => {
      if (!textareaRef.current) return

      const textarea = textareaRef.current
      const cursorPos = textarea.selectionStart
      const text = textarea.value

      // Get context to know what prefix to replace
      const context = getAutocompleteContext(text, cursorPos)
      const prefixLength = context.prefix.length

      // If we're in a string, we also need to account for the opening quote
      const replaceStart = context.inString
        ? cursorPos - prefixLength
        : cursorPos - prefixLength

      // Build the replacement text
      const beforePrefix = text.slice(0, replaceStart)
      const afterCursor = text.slice(cursorPos)

      // Insert the suggestion text
      const newText = beforePrefix + suggestion.insertText + afterCursor
      actions.setJsonText(newText)

      // Set cursor position after the inserted text
      const newCursorPos = replaceStart + suggestion.insertText.length
      requestAnimationFrame(() => {
        setCursorPosition(newCursorPos)
      })
    },
    [textareaRef, actions, setCursorPosition]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const autocompleteHandlers = {
        visible: autocomplete.visible,
        selectNext: autocomplete.selectNext,
        selectPrev: autocomplete.selectPrev,
        acceptSuggestion: autocomplete.acceptSuggestion,
        dismiss: autocomplete.dismiss,
      }

      const handler = createAutocompleteKeyDownHandler(
        keyboardHandlers,
        autocompleteHandlers,
        handleAcceptSuggestion
      )

      handler(e)
    },
    [keyboardHandlers, autocomplete, handleAcceptSuggestion]
  )

  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
    // Dismiss autocomplete on scroll
    autocomplete.dismiss()
  }, [autocomplete])

  // Calculate autocomplete popup position from cursor
  const updateAutocompletePosition = useCallback(() => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const cursorPos = textarea.selectionStart
    const text = textarea.value

    // Count lines before cursor
    const textBeforeCursor = text.slice(0, cursorPos)
    const linesBeforeCursor = textBeforeCursor.split('\n')
    const lineIndex = linesBeforeCursor.length - 1
    const columnIndex = linesBeforeCursor[lineIndex]?.length || 0

    // Calculate position
    const lineHeight = 24
    const charWidth = 9.6 // Approximate monospace character width
    const gutterWidth = showLineNumbers ? 48 : 16
    const paddingTop = 16

    // Account for scroll
    const top = paddingTop + lineIndex * lineHeight - scrollTop + lineHeight + 4
    const left = gutterWidth + columnIndex * charWidth

    autocomplete.setPosition({ top, left })
  }, [textareaRef, showLineNumbers, scrollTop, autocomplete])

  // Handle text changes and update autocomplete
  const handleTextChange = useCallback(
    (value: string) => {
      actions.setJsonText(value)

      // Update autocomplete suggestions
      if (textareaRef.current) {
        const cursorPos = textareaRef.current.selectionStart
        autocomplete.updateSuggestions(value, cursorPos)
        updateAutocompletePosition()
      }
    },
    [actions, textareaRef, autocomplete, updateAutocompletePosition]
  )

  // Handle cursor position changes (clicks, arrow keys)
  const handleSelect = useCallback(() => {
    if (!textareaRef.current) return

    const cursorPos = textareaRef.current.selectionStart
    const text = textareaRef.current.value

    // Dismiss if there's a selection range
    if (textareaRef.current.selectionStart !== textareaRef.current.selectionEnd) {
      autocomplete.dismiss()
      return
    }

    // Update suggestions for new cursor position
    autocomplete.updateSuggestions(text, cursorPos)
    updateAutocompletePosition()
  }, [textareaRef, autocomplete, updateAutocompletePosition])

  // Dismiss autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        autocomplete.dismiss()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [textareaRef, autocomplete])

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
        <div className={`relative rounded-lg overflow-hidden ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900/20'}`}>
          <JsonTextarea
            ref={textareaRef}
            value={state.jsonText}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
            onSelect={handleSelect}
            isValid={state.isValid}
            placeholder={placeholder}
            minHeight={minHeight}
            showLineNumbers={showLineNumbers}
            maskText={syntaxHighlighting}
          />

          {/* Autocomplete popup */}
          <AutocompletePopup
            suggestions={autocomplete.suggestions}
            selectedIndex={autocomplete.selectedIndex}
            onSelect={handleAcceptSuggestion}
            position={autocomplete.position}
            visible={autocomplete.visible}
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
              theme={theme}
            />
          )}
        </div>

        <ErrorDisplay errorMessage={state.errorMessage} />
      </div>
    </div>
  )
})

export default JsonEditable
