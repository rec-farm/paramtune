import type { AutocompleteContext, AutocompleteSuggestion } from '../types'

// Common JSON keys for schema editing
const COMMON_KEYS = [
  'name',
  'type',
  'value',
  'id',
  'description',
  '@extends',
  'version',
  'enabled',
  'config',
  'options',
  'settings',
  'data',
  'items',
  'properties',
  'required',
  'default',
  'schema',
  'title',
  'label',
  'key',
  'metadata',
]

// JSON value keywords
const VALUE_KEYWORDS = ['true', 'false', 'null']

/**
 * Parse the cursor context to determine what type of suggestions to show
 */
export function getAutocompleteContext(
  text: string,
  cursorPosition: number
): AutocompleteContext {
  // Get text before cursor
  const textBeforeCursor = text.slice(0, cursorPosition)

  // Find the current line
  const lastNewline = textBeforeCursor.lastIndexOf('\n')
  const line = lastNewline === -1 ? textBeforeCursor : textBeforeCursor.slice(lastNewline + 1)
  const column = line.length

  // Determine if we're inside a string
  const inString = isInsideString(textBeforeCursor)

  // Determine if we're after a colon (expecting a value)
  const afterColon = isAfterColon(line)

  // Extract the prefix (what the user has typed so far)
  const prefix = extractPrefix(line, inString)

  return {
    line,
    column,
    prefix,
    inString,
    afterColon,
  }
}

/**
 * Check if cursor is inside a string by counting unescaped quotes
 */
function isInsideString(textBeforeCursor: string): boolean {
  let inString = false
  let i = 0

  while (i < textBeforeCursor.length) {
    const char = textBeforeCursor[i]

    if (char === '\\' && i + 1 < textBeforeCursor.length) {
      // Skip escaped character
      i += 2
      continue
    }

    if (char === '"') {
      inString = !inString
    }

    i++
  }

  return inString
}

/**
 * Check if we're after a colon on the current line (expecting a value)
 */
function isAfterColon(line: string): boolean {
  // Find the last colon that's not inside a string
  let inString = false
  let lastColonIndex = -1

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '\\' && i + 1 < line.length) {
      i++
      continue
    }

    if (char === '"') {
      inString = !inString
    } else if (char === ':' && !inString) {
      lastColonIndex = i
    }
  }

  if (lastColonIndex === -1) return false

  // Check if there's only whitespace after the colon
  const afterColon = line.slice(lastColonIndex + 1)
  return afterColon.trim().length === 0 || /^\s*"?[^"]*$/.test(afterColon)
}

/**
 * Extract the prefix (partial word) the user is typing
 */
function extractPrefix(line: string, inString: boolean): string {
  if (inString) {
    // Find the opening quote and extract text after it
    const lastQuote = line.lastIndexOf('"')
    if (lastQuote !== -1) {
      return line.slice(lastQuote + 1)
    }
    return ''
  }

  // Outside string - look for word characters
  const match = line.match(/(\w+)$/)
  return match ? match[1] : ''
}

/**
 * Get suggestions based on context
 */
export function getSuggestions(
  context: AutocompleteContext,
  existingKeys: string[] = []
): AutocompleteSuggestion[] {
  const { prefix, afterColon, inString } = context

  // Don't show suggestions if:
  // - We're in the middle of a word (prefix should match word boundary)
  // - The prefix is too short and we're not explicitly typing
  if (!inString && context.line.length > 0) {
    const lastChar = context.line[context.line.length - 1]
    // Don't suggest if we're not at a word boundary
    if (lastChar && /\w/.test(lastChar) && prefix.length === 0) {
      return []
    }
  }

  // If we're after a colon, suggest values
  if (afterColon && !inString) {
    return getValueSuggestions(prefix)
  }

  // If we're in a string after a colon, suggest value keywords
  if (afterColon && inString) {
    return getStringValueSuggestions(prefix)
  }

  // Otherwise, suggest keys
  return getKeySuggestions(prefix, existingKeys)
}

/**
 * Get key suggestions filtered by prefix
 */
function getKeySuggestions(
  prefix: string,
  existingKeys: string[]
): AutocompleteSuggestion[] {
  const lowerPrefix = prefix.toLowerCase()

  // Combine common keys with existing keys from the document
  const allKeys = [...new Set([...COMMON_KEYS, ...existingKeys])]

  return allKeys
    .filter((key) => {
      // Filter by prefix (case-insensitive)
      if (lowerPrefix && !key.toLowerCase().startsWith(lowerPrefix)) {
        return false
      }
      // Don't suggest exact matches
      if (key.toLowerCase() === lowerPrefix) {
        return false
      }
      return true
    })
    .slice(0, 10) // Limit to 10 suggestions
    .map((key) => ({
      label: key,
      insertText: `"${key}"`,
      kind: 'key' as const,
    }))
}

/**
 * Get value suggestions (keywords like true, false, null)
 */
function getValueSuggestions(prefix: string): AutocompleteSuggestion[] {
  const lowerPrefix = prefix.toLowerCase()

  return VALUE_KEYWORDS
    .filter((keyword) => {
      if (lowerPrefix && !keyword.toLowerCase().startsWith(lowerPrefix)) {
        return false
      }
      if (keyword.toLowerCase() === lowerPrefix) {
        return false
      }
      return true
    })
    .map((keyword) => ({
      label: keyword,
      insertText: keyword,
      kind: 'keyword' as const,
    }))
}

/**
 * Get string value suggestions
 */
function getStringValueSuggestions(prefix: string): AutocompleteSuggestion[] {
  // Common string values for schema editing
  const commonValues = [
    'string',
    'number',
    'boolean',
    'object',
    'array',
    'null',
    'integer',
  ]

  const lowerPrefix = prefix.toLowerCase()

  return commonValues
    .filter((value) => {
      if (lowerPrefix && !value.toLowerCase().startsWith(lowerPrefix)) {
        return false
      }
      if (value.toLowerCase() === lowerPrefix) {
        return false
      }
      return true
    })
    .slice(0, 10)
    .map((value) => ({
      label: value,
      insertText: value,
      kind: 'value' as const,
    }))
}

/**
 * Extract existing keys from JSON text for suggestions
 */
export function extractExistingKeys(text: string): string[] {
  const keys: string[] = []
  // Match quoted keys before colons
  const keyRegex = /"([^"]+)"\s*:/g
  let match

  while ((match = keyRegex.exec(text)) !== null) {
    if (match[1] && !keys.includes(match[1])) {
      keys.push(match[1])
    }
  }

  return keys
}
