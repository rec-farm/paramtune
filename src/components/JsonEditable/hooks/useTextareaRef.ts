'use client'

import { useCallback, useRef } from 'react'

export interface UseTextareaRefReturn {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  setCursorPosition: (position: number) => void
  insertTextAtCursor: (text: string) => void
  getCurrentLineInfo: () => {
    currentLine: string
    currentIndent: string
    lineNumber: number
  }
}

export function useTextareaRef(): UseTextareaRefReturn {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const setCursorPosition = useCallback((position: number) => {
    if (textareaRef.current) {
      // Use requestAnimationFrame to ensure the DOM is updated
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = position
          // Focus the textarea to ensure cursor is visible
          textareaRef.current.focus()
        }
      })
    }
  }, [])

  const insertTextAtCursor = useCallback(
    (text: string) => {
      if (!textareaRef.current) return

      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value

      const newValue = value.substring(0, start) + text + value.substring(end)

      // Trigger change event
      const event = new Event('input', { bubbles: true })
      Object.defineProperty(event, 'target', {
        value: textarea,
        enumerable: true,
      })
      Object.defineProperty(event, 'currentTarget', {
        value: textarea,
        enumerable: true,
      })
      textarea.value = newValue
      textarea.dispatchEvent(event)

      // Set cursor position after inserted text
      requestAnimationFrame(() => {
        setCursorPosition(start + text.length)
      })
    },
    [setCursorPosition]
  )

  const getCurrentLineInfo = useCallback(() => {
    if (!textareaRef.current) {
      return { currentLine: '', currentIndent: '', lineNumber: 0 }
    }

    const textarea = textareaRef.current
    const start = textarea.selectionStart
    const value = textarea.value

    const lines = value.substring(0, start).split('\n')
    const currentLine = lines[lines.length - 1] || ''
    const currentIndent = currentLine.match(/^\s*/)?.[0] || ''
    const lineNumber = lines.length

    return {
      currentLine,
      currentIndent,
      lineNumber,
    }
  }, [])

  return {
    textareaRef,
    setCursorPosition,
    insertTextAtCursor,
    getCurrentLineInfo,
  }
}
