export interface JsonEditableProps {
  title: string
  name?: string
  defaultValue?: string
  onValidationChange?: (isValid: boolean) => void
  className?: string
  placeholder?: string
  minHeight?: number
  maxHeight?: number
  readOnly?: boolean
  showLineNumbers?: boolean
  showActions?: boolean
  syntaxHighlighting?: boolean
  autoFormat?: boolean
  renderToolbar?: (args: {
    jsonText: string
    setJsonText: (value: string) => void
    isValid: boolean
    errorMessage?: string
    onFormat: () => void
    onCopy: () => void
    onDownload: () => void
  }) => React.ReactNode
  showHeader?: boolean
}

export interface UseTextareaRefReturn {
  textareaRef: React.RefObject<HTMLTextAreaElement>
  setCursorPosition: (position: number) => void
  insertTextAtCursor: (text: string) => void
  getCurrentLineInfo: () => {
    currentLine: string
    currentIndent: string
    lineNumber: number
  }
}

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

export interface ValidationStatusProps {
  isValid: boolean
  errorMessage?: string
  issues?: ValidationIssue[]
}

export interface ActionButtonsProps {
  isValid: boolean
  onFormat: () => void
  onCopy: () => void
  onDownload: () => void
}

export interface ErrorDisplayProps {
  errorMessage?: string
  issues?: ValidationIssue[]
}

export interface LineNumbersProps {
  lineCount: number
}

export interface JsonTextareaProps {
  value: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  isValid: boolean
  placeholder?: string
  readOnly?: boolean
  minHeight?: number
  maxHeight?: number
}

export interface SyntaxHighlightOverlayProps {
  highlightedHtml: string
}

export interface JsonEditorConfig {
  theme: SyntaxHighlightTheme
  options: SyntaxHighlightOptions
  keyboardShortcuts: boolean
  autoComplete: boolean
  lineNumbers: boolean
  actions: boolean
}

export interface JsonValidationResult {
  isValid: boolean
  error?: string
  data?: Record<string, unknown>
}

export interface JsonEditorEventHandlers {
  onChange?: (value: string, isValid: boolean) => void
  onValidationChange?: (isValid: boolean) => void
  onFormat?: () => void
  onCopy?: () => void
  onDownload?: () => void
  onError?: (error: string) => void
}

// Autocomplete types
export type AutocompleteSuggestionKind = 'key' | 'value' | 'keyword'

export interface AutocompleteSuggestion {
  label: string
  insertText: string
  kind: AutocompleteSuggestionKind
}

export interface AutocompleteContext {
  line: string
  column: number
  prefix: string
  inString: boolean
  afterColon: boolean
}

export interface AutocompletePopupProps {
  suggestions: AutocompleteSuggestion[]
  selectedIndex: number
  onSelect: (suggestion: AutocompleteSuggestion) => void
  position: { top: number; left: number }
  visible: boolean
}

export interface UseAutocompleteOptions {
  text: string
  cursorPosition: number
  existingKeys?: string[]
  enabled?: boolean
}

export interface UseAutocompleteReturn {
  suggestions: AutocompleteSuggestion[]
  selectedIndex: number
  visible: boolean
  position: { top: number; left: number }
  userHasNavigated: boolean
  selectNext: () => void
  selectPrev: () => void
  acceptSuggestion: () => AutocompleteSuggestion | null
  dismiss: () => void
  updateSuggestions: (text: string, cursorPos: number) => void
  setPosition: (position: { top: number; left: number }) => void
}

// Validation types
export type ValidationIssueType = 'error' | 'warning'

export interface ValidationIssue {
  type: ValidationIssueType
  message: string
  line?: number
  column?: number
}

export interface ValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
}
