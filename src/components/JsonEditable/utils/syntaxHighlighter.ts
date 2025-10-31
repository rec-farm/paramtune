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

export function highlightJson(
  json: string,
  options: SyntaxHighlightOptions = {},
  theme: SyntaxHighlightTheme = DEFAULT_THEME
): string {
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

  let highlighted = json

  // Simple and reliable approach: highlight in order of specificity

  // 1. Highlight string values (most specific pattern first)
  if (highlightStrings) {
    const beforeStringHighlight = highlighted
    highlighted = highlighted.replace(
      /:\s*("(?:[^"\\]|\\.)*")/g,
      `: <span class="${theme.strings}">$1</span>`
    )
  }

  // 2. Highlight boolean values
  if (highlightBooleans) {
    highlighted = highlighted.replace(
      /:\s*(true|false)/g,
      `: <span class="${theme.booleans}">$1</span>`
    )
  }

  // 3. Highlight null values
  if (highlightNull) {
    highlighted = highlighted.replace(
      /:\s*(null)/g,
      `: <span class="${theme.null}">$1</span>`
    )
  }

  // 4. Highlight numbers
  if (highlightNumbers) {
    highlighted = highlighted.replace(
      /:\s*(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
      `: <span class="${theme.numbers}">$1</span>`
    )
  }

  // 5. Highlight @extends keys with special styling
  if (highlightExtends) {
    highlighted = highlighted.replace(
      /("(?:@extends)")(\s*:)/g,
      `<span class="${theme.extends}">$1</span><span class="${theme.colons}">$2</span>`
    )
  }

  // 6. Highlight other keys
  if (highlightKeys) {
    highlighted = highlighted.replace(
      /("(?:[^"\\]|\\.)*")(\s*:)/g,
      `<span class="${theme.keys}">$1</span><span class="${theme.colons}">$2</span>`
    )
  }

  // 7. Highlight brackets
  if (highlightBrackets) {
    highlighted = highlighted.replace(
      /([{}[\]])/g,
      `<span class="${theme.brackets}">$1</span>`
    )
  }

  // 8. Highlight commas
  if (highlightCommas) {
    highlighted = highlighted.replace(
      /(,)/g,
      `<span class="${theme.commas}">$1</span>`
    )
  }

  return highlighted
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
