import type { ValidationResult, ValidationIssue } from '../types'

/**
 * Calculate line and column from text position
 */
function getLineColumn(
  text: string,
  position: number
): { line: number; column: number } {
  const before = text.slice(0, position)
  const lines = before.split('\n')
  const line = lines.length
  const column = (lines[lines.length - 1]?.length ?? 0) + 1
  return { line, column }
}

/**
 * Detect duplicate keys in JSON text
 * Returns warnings for each duplicate key found
 */
function detectDuplicateKeys(text: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const keyOccurrences = new Map<string, { count: number; positions: number[] }>()

  // Match JSON keys - handles nested objects by tracking all key occurrences
  // This regex finds keys at any level: "keyName":
  const keyRegex = /"([^"\\]|\\.)*"\s*:/g
  let match

  while ((match = keyRegex.exec(text)) !== null) {
    const fullMatch = match[0]
    const keyWithQuotes = fullMatch.slice(0, fullMatch.lastIndexOf('"') + 1)
    const key = keyWithQuotes.slice(1, -1) // Remove quotes

    // Find which object level this key belongs to by counting braces
    const textBefore = text.slice(0, match.index)
    const openBraces = (textBefore.match(/\{/g) || []).length
    const closeBraces = (textBefore.match(/\}/g) || []).length
    const level = openBraces - closeBraces

    // Create a unique identifier for key at this level
    const levelKey = `${level}:${key}`

    if (!keyOccurrences.has(levelKey)) {
      keyOccurrences.set(levelKey, { count: 0, positions: [] })
    }
    const occurrence = keyOccurrences.get(levelKey)!
    occurrence.count++
    occurrence.positions.push(match.index)
  }

  // Report duplicates
  for (const [levelKey, { count, positions }] of keyOccurrences) {
    if (count > 1) {
      const key = levelKey.split(':').slice(1).join(':') // Get key name, handling keys with colons
      // Report on second and subsequent occurrences
      for (let i = 1; i < positions.length; i++) {
        const { line, column } = getLineColumn(text, positions[i])
        issues.push({
          type: 'warning',
          message: `Duplicate key "${key}" - later value will override earlier one`,
          line,
          column,
        })
      }
    }
  }

  return issues
}

/**
 * Detect trailing commas in JSON text
 * Returns warnings for each trailing comma found
 */
function detectTrailingCommas(text: string): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Match trailing comma before closing brace or bracket
  // Handles whitespace and newlines between comma and closing delimiter
  const trailingCommaRegex = /,\s*([}\]])/g
  let match

  while ((match = trailingCommaRegex.exec(text)) !== null) {
    const { line, column } = getLineColumn(text, match.index)
    const closingChar = match[1]
    issues.push({
      type: 'warning',
      message: `Trailing comma before ${closingChar === '}' ? 'closing brace' : 'closing bracket'}`,
      line,
      column,
    })
  }

  return issues
}

/**
 * Extract line and column from JSON.parse error message
 */
function extractErrorPosition(
  errorMessage: string,
  text: string
): { line?: number; column?: number } {
  // Try to extract position from error message like "at position 123"
  const posMatch = errorMessage.match(/position\s+(\d+)/i)
  if (posMatch) {
    const position = parseInt(posMatch[1], 10)
    return getLineColumn(text, position)
  }

  // Try to extract line/column directly from error message
  const lineColMatch = errorMessage.match(/line\s+(\d+)/i)
  if (lineColMatch) {
    const line = parseInt(lineColMatch[1], 10)
    const colMatch = errorMessage.match(/column\s+(\d+)/i)
    const column = colMatch ? parseInt(colMatch[1], 10) : undefined
    return { line, column }
  }

  return {}
}

/**
 * Validate JSON text and return structured results
 * Checks for syntax errors, duplicate keys, and trailing commas
 */
export function validateJson(text: string): ValidationResult {
  const issues: ValidationIssue[] = []

  // Empty text is valid (empty object)
  if (!text.trim()) {
    return { isValid: true, issues: [] }
  }

  // Check for syntax errors first
  try {
    JSON.parse(text)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Invalid JSON syntax'
    const { line, column } = extractErrorPosition(errorMessage, text)

    issues.push({
      type: 'error',
      message: errorMessage,
      line,
      column,
    })

    // If there's a syntax error, return immediately
    // (duplicate key and trailing comma detection may not be reliable on invalid JSON)
    return { isValid: false, issues }
  }

  // JSON is syntactically valid, check for warnings
  const duplicateKeyWarnings = detectDuplicateKeys(text)
  const trailingCommaWarnings = detectTrailingCommas(text)

  issues.push(...duplicateKeyWarnings, ...trailingCommaWarnings)

  // Valid if no errors (warnings are allowed)
  const hasErrors = issues.some((issue) => issue.type === 'error')

  return { isValid: !hasErrors, issues }
}
