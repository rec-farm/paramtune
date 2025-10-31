// Optimized syntax highlighter inspired by Monaco Editor
// Only highlights visible lines and uses efficient regex patterns

export interface SyntaxHighlightOptions {
  highlightExtends?: boolean
  highlightKeys?: boolean
  highlightStrings?: boolean
  highlightBooleans?: boolean
  highlightNull?: boolean
  highlightNumbers?: boolean
  highlightBrackets?: boolean
  highlightCommas?: boolean
}

export interface SyntaxHighlightTheme {
  extends: string
  keys: string
  strings: string
  booleans: string
  null: string
  numbers: string
  brackets: string
  commas: string
  colons: string
}

const DEFAULT_THEME: SyntaxHighlightTheme = {
  extends: 'text-cyan-400 font-bold bg-cyan-400/10 px-1 rounded',
  keys: 'text-purple-400 font-medium',
  strings: 'text-green-400 font-medium',
  booleans: 'text-orange-400 font-bold',
  null: 'text-gray-500 italic',
  numbers: 'text-blue-400 font-medium',
  brackets: 'text-gray-200 font-bold',
  commas: 'text-gray-500',
  colons: 'text-gray-400',
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
const CACHE_SIZE_LIMIT = 1000

function clearCacheIfNeeded() {
  if (highlightCache.size > CACHE_SIZE_LIMIT) {
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
  const cacheKey = `${line}-${JSON.stringify(options)}-${JSON.stringify(theme)}`

  if (highlightCache.has(cacheKey)) {
    return highlightCache.get(cacheKey)!
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

  let highlighted = line

  // Debug: Log the line being highlighted
  console.log('highlightJsonLine: Input line:', line)

  // Apply highlighting in order of specificity - VALUES FIRST, then KEYS
  // 1. Highlight string values FIRST (most specific pattern)
  if (highlightStrings) {
    const beforeStringHighlight = highlighted
    highlighted = highlighted.replace(
      REGEX_PATTERNS.strings,
      `: <span class="${theme.strings}">$1</span>`
    )
    if (beforeStringHighlight !== highlighted) {
      console.log(
        'highlightJsonLine: Applied string highlighting to line:',
        line
      )
      console.log('highlightJsonLine: After string highlight:', highlighted)
    }
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

  // Debug: Log the final result
  console.log('highlightJsonLine: Final highlighted line:', highlighted)

  // Cache the result
  clearCacheIfNeeded()
  highlightCache.set(cacheKey, highlighted)

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
