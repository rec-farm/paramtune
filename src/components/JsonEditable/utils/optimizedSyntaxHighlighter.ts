// Optimized syntax highlighter inspired by Monaco Editor
// Only highlights visible lines and uses efficient regex patterns

import type { SyntaxHighlightOptions, SyntaxHighlightTheme } from '../types'
import { EDITOR_CONSTANTS } from './editorConstants'

export const DEFAULT_THEME: SyntaxHighlightTheme = {
  extends: 'text-syntax-extends',
  keys: 'text-syntax-key',
  strings: 'text-syntax-string',
  booleans: 'text-syntax-literal',
  null: 'text-syntax-literal',
  numbers: 'text-syntax-number',
  brackets: 'text-syntax-punct',
  commas: 'text-syntax-punct',
  colons: 'text-syntax-punct',
}

/**
 * Escapes HTML special characters in a string to prevent XSS.
 * We only escape &, <, and > because escaping quotes would break
 * the regex patterns used for syntax highlighting.
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  }
  return text.replace(/[&<>]/g, (m) => map[m])
}

// Pre-compiled regex patterns for better performance
const REGEX_PATTERNS = {
  extends: /("(?:@extends)")(\s*:)/g,
  keys: /("(?:[^"\\]|\\.)*")(\s*:)/g,
  strings: /:\s*("(?:[^"\\]|\\.)*")/g,
  booleans: /:\s*(true|false)/g,
  null: /:\s*(null)/g,
  numbers: /:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
  brackets: /([{}[\]])/g,
  commas: /(,)/g,
}

// Cache for highlighted lines to avoid re-computation
const highlightCache = new Map<string, string>()

function clearCacheIfNeeded() {
  if (highlightCache.size > EDITOR_CONSTANTS.CACHE_SIZE_LIMIT) {
    // Clear oldest 50% of cache
    const entries = Array.from(highlightCache.entries())
    const toDelete = entries.slice(0, Math.floor(entries.length / 2))
    toDelete.forEach(([key]) => highlightCache.delete(key))
  }
}

export function highlightJsonLine(
  line: string,
  options: SyntaxHighlightOptions = {},
  theme: SyntaxHighlightTheme = DEFAULT_THEME
): string {
  // Only the default theme is cached; options are rarely changed, so the
  // cache key is the line content alone
  const cacheable = theme === DEFAULT_THEME
  if (cacheable && highlightCache.has(line)) {
    return highlightCache.get(line)!
  }

  const {
    highlightExtends = true,
    highlightKeys = true,
    highlightStrings = true,
    highlightBooleans = true,
    highlightNull = true,
    highlightNumbers = true,
    highlightBrackets = true,
    highlightCommas = true,
  } = options

  // Escape HTML characters before adding any highlight spans to prevent XSS
  let highlighted = escapeHtml(line)

  // Apply highlighting in order of specificity - VALUES FIRST, then KEYS
  // 1. Highlight string values FIRST (most specific pattern)
  if (highlightStrings) {
    highlighted = highlighted.replace(
      REGEX_PATTERNS.strings,
      `: <span class="${theme.strings}">$1</span>`
    )
  }

  // 2. Highlight boolean values
  if (highlightBooleans) {
    highlighted = highlighted.replace(
      REGEX_PATTERNS.booleans,
      `: <span class="${theme.booleans}">$1</span>`
    )
  }

  // 3. Highlight null values
  if (highlightNull) {
    highlighted = highlighted.replace(
      REGEX_PATTERNS.null,
      `: <span class="${theme.null}">$1</span>`
    )
  }

  // 4. Highlight numbers
  if (highlightNumbers) {
    highlighted = highlighted.replace(
      REGEX_PATTERNS.numbers,
      `: <span class="${theme.numbers}">$1</span>`
    )
  }

  // 5. Highlight @extends keys with special styling
  if (highlightExtends) {
    highlighted = highlighted.replace(
      REGEX_PATTERNS.extends,
      `<span class="${theme.extends}">$1</span><span class="${theme.colons}">$2</span>`
    )
  }

  // 6. Highlight other keys LAST (after values are highlighted)
  if (highlightKeys) {
    highlighted = highlighted.replace(
      REGEX_PATTERNS.keys,
      `<span class="${theme.keys}">$1</span><span class="${theme.colons}">$2</span>`
    )
  }

  // 7. Highlight brackets
  if (highlightBrackets) {
    highlighted = highlighted.replace(
      REGEX_PATTERNS.brackets,
      `<span class="${theme.brackets}">$1</span>`
    )
  }

  // 8. Highlight commas
  if (highlightCommas) {
    highlighted = highlighted.replace(
      REGEX_PATTERNS.commas,
      `<span class="${theme.commas}">$1</span>`
    )
  }

  if (cacheable) {
    clearCacheIfNeeded()
    highlightCache.set(line, highlighted)
  }

  return highlighted
}

export function highlightJsonVisibleLines(
  json: string,
  startLine: number = 0,
  endLine: number = 50,
  options: SyntaxHighlightOptions = {},
  theme: SyntaxHighlightTheme = DEFAULT_THEME
): string {
  const lines = json.split('\n')
  const visibleLines = lines.slice(startLine, endLine + 1)

  return visibleLines
    .map((line, index) => highlightJsonLine(line, options, theme))
    .join('\n')
}

// Optimized version that accepts pre-sliced visible lines array
export function highlightVisibleLines(
  visibleLines: string[],
  options: SyntaxHighlightOptions = {},
  theme: SyntaxHighlightTheme = DEFAULT_THEME
): string {
  return visibleLines
    .map((line) => highlightJsonLine(line, options, theme))
    .join('\n')
}

// Fallback to full highlighting for small documents
export function highlightJson(
  json: string,
  options: SyntaxHighlightOptions = {},
  theme: SyntaxHighlightTheme = DEFAULT_THEME
): string {
  if (json.split('\n').length <= 100) {
    return json
      .split('\n')
      .map((line) => highlightJsonLine(line, options, theme))
      .join('\n')
  }

  // For large documents, only highlight visible portion
  return highlightJsonVisibleLines(json, 0, 50, options, theme)
}

export function createCustomTheme(
  overrides: Partial<SyntaxHighlightTheme>
): SyntaxHighlightTheme {
  return { ...DEFAULT_THEME, ...overrides }
}

export function validateJsonSyntax(json: string): {
  isValid: boolean
  error?: string
} {
  try {
    JSON.parse(json)
    return { isValid: true }
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Invalid JSON syntax',
    }
  }
}

// Clear cache when needed
export function clearHighlightCache() {
  highlightCache.clear()
}
