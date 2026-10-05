import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { CircleCheck, CircleX, LoaderCircle } from 'lucide-react'
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
import { EDITOR_CONSTANTS } from './utils/editorConstants'
import type { JsonEditableProps, AutocompleteSuggestion } from './types'

const JsonEditable = memo(function JsonEditable({
  title,
  name,
  defaultValue,
  onValidationChange,
  className = '',
  placeholder = 'Enter valid JSON...',
  minHeight = 80,
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

      const replaceStart = cursorPos - prefixLength

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
        userHasNavigated: autocomplete.userHasNavigated,
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
    const lineHeight = EDITOR_CONSTANTS.LINE_HEIGHT
    const charWidth = EDITOR_CONSTANTS.CHAR_WIDTH
    const gutterWidth = showLineNumbers ? EDITOR_CONSTANTS.PADDING_LEFT : EDITOR_CONSTANTS.PADDING_LEFT_COMPACT
    const paddingTop = EDITOR_CONSTANTS.PADDING_TOP

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
  const lineHeight = EDITOR_CONSTANTS.LINE_HEIGHT
  const bufferLines = EDITOR_CONSTANTS.BUFFER_LINES

  const visibleStart = Math.max(
    0,
    Math.floor(scrollTop / lineHeight) - bufferLines
  )
  const visibleEnd = Math.min(
    lineCount - 1,
    Math.ceil((scrollTop + containerHeight) / lineHeight) + bufferLines
  )

  // Memoize visible lines slice to prevent array recreation on every render
  const visibleLines = useMemo(
    () => lines.slice(visibleStart, visibleEnd + 1),
    [lines, visibleStart, visibleEnd]
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
      <input type="hidden" name={name} value={state.jsonText} />

      {/* Header / Toolbar */}
      {showHeader && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ValidationStatus
              isValid={state.isValid}
              errorMessage={state.errorMessage}
              issues={state.issues}
              isValidating={state.isValidating}
            />
            {state.isDirty && (
              <div className="pt-label inline-flex items-center gap-1 border border-dashed border-warn/40 bg-warn/10 px-2 py-0.5 text-warn">
                Unsaved changes
              </div>
            )}
          </div>

          {renderToolbar ? (
            <div className="flex flex-wrap items-center gap-2">
              {renderToolbar({
                jsonText: state.jsonText,
                setJsonText: actions.setJsonText,
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
        <div className={`relative overflow-hidden border border-border focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary bg-surface`}>
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
                  background: 'var(--danger-soft)',
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
                  background: 'var(--danger-icon)',
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
                    background: 'var(--danger-icon)',
                  }}
                />
                {/* tooltip - hover only */}
                <div
                  role="tooltip"
                  className="absolute text-xs bg-popover border border-border-strong text-danger px-2 py-1 shadow-pop rounded-md whitespace-pre max-w-sm opacity-0 group-hover:opacity-100 transition-opacity duration-150 font-mono"
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
              visibleLines={visibleLines}
              lineHeight={lineHeight}
              scrollTop={scrollTop}
              showLineNumbers={showLineNumbers}
            />
          )}

          {/* Status bar */}
          <div className="relative z-30 border-t border-border px-4 h-10 flex items-center justify-between gap-4 text-xs">
            {/* The header already shows validation state */}
            {showHeader ? (
              <span />
            ) : (
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  state.isValidating
                    ? 'text-muted-foreground'
                    : state.isValid
                      ? 'text-success'
                      : 'text-danger'
                }`}
              >
                {state.isValidating ? (
                  <LoaderCircle className="w-4 h-4 animate-spin motion-reduce:animate-none" strokeWidth={1.5} aria-hidden="true" />
                ) : state.isValid ? (
                  <CircleCheck className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                ) : (
                  <CircleX className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
                )}
                {state.isValidating ? 'Validating' : state.isValid ? 'Valid JSON' : 'Invalid JSON'}
              </span>
            )}
            <span className="text-meta tabular-nums">
              {lineCount} {lineCount === 1 ? 'line' : 'lines'} · {new Blob([state.jsonText]).size} B · UTF-8
            </span>
          </div>
        </div>

        <ErrorDisplay errorMessage={state.errorMessage} issues={state.issues} />
      </div>
    </div>
  )
})

export default JsonEditable
