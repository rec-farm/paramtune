import { UseTextareaRefReturn } from '../hooks/useTextareaRef'

export interface KeyboardHandlerOptions {
  insertTextAtCursor: (text: string) => void
  setCursorPosition: (position: number) => void
  getCurrentLineInfo: () => {
    currentLine: string
    currentIndent: string
    lineNumber: number
  }
  onTextChange: (value: string) => void
}

export interface BraceMatchingResult {
  shouldAutoClose: boolean
  matchingIndent: string
}

export function findMatchingBrace(
  value: string,
  start: number,
  openChar: '{' | '[',
  closeChar: '}' | ']'
): BraceMatchingResult {
  const openCount = (
    value.substring(0, start).match(new RegExp(`\\${openChar}`, 'g')) || []
  ).length
  const closeCount = (
    value.substring(0, start).match(new RegExp(`\\${closeChar}`, 'g')) || []
  ).length

  if (openCount <= closeCount) {
    return { shouldAutoClose: false, matchingIndent: '' }
  }

  // Find the matching opening brace/bracket
  let braceCount = 0
  let matchFound = false
  let matchIndent = ''

  for (let i = start - 1; i >= 0; i--) {
    const char = value[i]
    if (char === closeChar) braceCount++
    else if (char === openChar) {
      braceCount--
      if (braceCount === 0) {
        matchFound = true
        // Find the indentation of the opening brace line
        const lines = value.substring(0, i).split('\n')
        const openingLine = lines[lines.length - 1]
        matchIndent = openingLine.match(/^\s*/)?.[0] || ''
        break
      }
    }
  }

  return {
    shouldAutoClose: matchFound,
    matchingIndent: matchIndent,
  }
}

export function calculateNewLineIndent(
  currentLine: string,
  currentIndent: string
): string {
  // If current line ends with { or [, add extra indentation
  if (currentLine.trim().endsWith('{') || currentLine.trim().endsWith('[')) {
    return currentIndent + '  '
  }
  // If current line ends with } or ], reduce indentation
  else if (
    currentLine.trim().endsWith('}') ||
    currentLine.trim().endsWith(']')
  ) {
    return currentIndent.slice(0, -2)
  }

  return currentIndent
}

export function createKeyboardHandlers({
  insertTextAtCursor,
  setCursorPosition,
  getCurrentLineInfo,
  onTextChange,
}: KeyboardHandlerOptions) {
  return {
    handleTab: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value
      const inserted = '  '
      const newValue =
        value.substring(0, start) + inserted + value.substring(end)
      onTextChange(newValue)
      requestAnimationFrame(() => {
        setCursorPosition(start + inserted.length)
      })
    },

    handleEnter: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault()

      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value

      const { currentLine, currentIndent } = getCurrentLineInfo()
      let newIndent = calculateNewLineIndent(currentLine, currentIndent)

      // If next non-space is a closing brace/bracket and current line lacks a comma, add one before newline
      const after = value.substring(end)
      const nextNonSpace = after.match(/\S/)
      const trimmed = currentLine.trim()
      const needsComma =
        trimmed.length > 0 &&
        !trimmed.endsWith(',') &&
        nextNonSpace &&
        (nextNonSpace[0] === '}' || nextNonSpace[0] === ']')

      const before = value.substring(0, start)
      const insertion = `${needsComma ? ',' : ''}\n${newIndent}`
      const newValue = before + insertion + value.substring(end)
      onTextChange(newValue)

      requestAnimationFrame(() => {
        setCursorPosition(start + insertion.length)
      })
    },

    handleClosingBrace: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value

      const result = findMatchingBrace(value, start, '{', '}')

      if (result.shouldAutoClose) {
        e.preventDefault()
        const insertion = `\n${result.matchingIndent}}`
        const newValue =
          value.substring(0, start) + insertion + value.substring(end)
        onTextChange(newValue)
        requestAnimationFrame(() => {
          setCursorPosition(start + insertion.length)
        })
      }
    },

    handleClosingBracket: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value

      const result = findMatchingBrace(value, start, '[', ']')

      if (result.shouldAutoClose) {
        e.preventDefault()
        const insertion = `\n${result.matchingIndent}]`
        const newValue =
          value.substring(0, start) + insertion + value.substring(end)
        onTextChange(newValue)
        requestAnimationFrame(() => {
          setCursorPosition(start + insertion.length)
        })
      }
    },

    handleOpeningBrace: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value
      const insertion = '{\n  \n}'
      const newValue =
        value.substring(0, start) + insertion + value.substring(end)
      onTextChange(newValue)
      requestAnimationFrame(() => {
        setCursorPosition(start + 3)
      })
    },

    handleOpeningBracket: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value
      const insertion = '[\n  \n]'
      const newValue =
        value.substring(0, start) + insertion + value.substring(end)
      onTextChange(newValue)
      requestAnimationFrame(() => {
        setCursorPosition(start + 3)
      })
    },

    handleQuote: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value
      const insertion = '""'
      const newValue =
        value.substring(0, start) + insertion + value.substring(end)
      onTextChange(newValue)
      requestAnimationFrame(() => {
        setCursorPosition(start + 1)
      })
    },

    // Lightweight smart assist: when typing ':', auto add space and empty string value
    handleColon: (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value
      const insertion = ': ""'
      const newValue =
        value.substring(0, start) + insertion + value.substring(end)
      onTextChange(newValue)
      requestAnimationFrame(() => {
        // place cursor between quotes
        setCursorPosition(start + 3)
      })
    },
  }
}

export function createKeyDownHandler(
  handlers: ReturnType<typeof createKeyboardHandlers>
) {
  return (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    switch (e.key) {
      case 'Tab':
        handlers.handleTab(e)
        break
      case 'Enter':
        handlers.handleEnter(e)
        break
      case ':':
        handlers.handleColon(e)
        break
      case '}':
        handlers.handleClosingBrace(e)
        break
      case ']':
        handlers.handleClosingBracket(e)
        break
      case '{':
        handlers.handleOpeningBrace(e)
        break
      case '[':
        handlers.handleOpeningBracket(e)
        break
      case '"':
        handlers.handleQuote(e)
        break
      default:
        // Let other keys pass through
        break
    }
  }
}
