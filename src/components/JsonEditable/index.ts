// Main component
export { default as JsonEditable } from './JsonEditable'

// Hooks
export { useOptimizedJsonEditor } from './hooks/useOptimizedJsonEditor'
export { useTextareaRef } from './hooks/useTextareaRef'
export { useAutocomplete } from './hooks/useAutocomplete'

// Components
export { ValidationStatus } from './components/ValidationStatus'
export { ActionButtons } from './components/ActionButtons'
export { ErrorDisplay } from './components/ErrorDisplay'
export { AutocompletePopup } from './components/AutocompletePopup'

// Utils
export {
  getAutocompleteContext,
  getSuggestions,
  extractExistingKeys,
} from './utils/autocomplete'

// Types
export type {
  UseTextareaRefReturn,
  ValidationStatusProps,
  ActionButtonsProps,
  ErrorDisplayProps,
  JsonEditorConfig,
  JsonEditorTheme,
  JsonValidationResult,
  JsonEditorEventHandlers,
  AutocompleteSuggestion,
  AutocompleteSuggestionKind,
  AutocompleteContext,
  AutocompletePopupProps,
  UseAutocompleteOptions,
  UseAutocompleteReturn,
} from './types'
