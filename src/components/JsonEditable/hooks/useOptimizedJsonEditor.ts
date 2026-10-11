import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { validateJson } from '../utils/validation'
import type { ValidationIssue } from '../types'

export interface OptimizedJsonEditorState {
  data: Record<string, unknown>
  jsonText: string
  isValid: boolean
  errorMessage: string
  isDirty: boolean
  issues: ValidationIssue[]
  isValidating: boolean
}

export interface OptimizedJsonEditorActions {
  setJsonText: (text: string) => void
  formatJson: () => void
  resetToDefault: () => void
}

export interface UseOptimizedJsonEditorOptions {
  defaultValue?: string
  onValidationChange?: (isValid: boolean) => void
  validationDelay?: number
}

function safeParseJson(value?: string): Record<string, unknown> {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    // Intentionally silent - invalid JSON returns empty object
    // This is expected during typing/editing
    return {}
  }
}

/**
 * Parses and pretty-prints a JSON string for the Format action, or returns
 * null if it doesn't currently parse. Formats the text itself rather than
 * relying on a prior parse, since validation is debounced (see setJsonText
 * below) and a stale parse would silently discard keystrokes made during
 * the debounce window.
 */
export function formatJsonText(
  text: string
): { formatted: string; data: Record<string, unknown> } | null {
  try {
    const parsed = JSON.parse(text)
    if (typeof parsed !== 'object' || parsed === null) return null
    return { formatted: JSON.stringify(parsed, null, 2), data: parsed }
  } catch {
    return null
  }
}

export function useOptimizedJsonEditor({
  defaultValue,
  onValidationChange,
  validationDelay = 500,
}: UseOptimizedJsonEditorOptions) {
  const initial = useMemo(() => safeParseJson(defaultValue), [defaultValue])

  const [state, setState] = useState<OptimizedJsonEditorState>({
    data: initial,
    jsonText: JSON.stringify(initial, null, 2),
    isValid: true,
    errorMessage: '',
    isDirty: false,
    issues: [],
    isValidating: false,
  })

  // Use refs to avoid unnecessary re-renders
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastValidJsonRef = useRef<string>(JSON.stringify(initial, null, 2))

  // Optimized text change handler - no immediate validation
  const setJsonText = useCallback(
    (value: string) => {
      setState((prevState) => ({
        ...prevState,
        jsonText: value,
        isDirty: value !== lastValidJsonRef.current,
        isValidating: true,
      }))

      // Clear previous validation timeout
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }

      // Debounced validation using new validation engine
      validationTimeoutRef.current = setTimeout(() => {
        const result = validateJson(value)

        if (result.isValid) {
          // Parse to get data (we know it's valid JSON)
          const parsed = safeParseJson(value)
          setState((prevState) => ({
            ...prevState,
            data: parsed,
            isValid: true,
            errorMessage: '',
            isDirty: false,
            issues: result.issues,
            isValidating: false,
          }))
          lastValidJsonRef.current = value
          onValidationChange?.(true)
        } else {
          // Get first error message for backwards compatibility
          const firstError = result.issues.find((i) => i.type === 'error')
          setState((prevState) => ({
            ...prevState,
            isValid: false,
            errorMessage: firstError?.message ?? 'Invalid JSON syntax',
            issues: result.issues,
            isValidating: false,
          }))
          onValidationChange?.(false)
        }
      }, validationDelay)
    },
    [onValidationChange, validationDelay]
  )

  const formatJson = useCallback(() => {
    // Format what's on screen (state.jsonText), not state.data: data only
    // updates once the debounced validation in setJsonText fires, so a
    // format triggered mid-debounce would otherwise overwrite the user's
    // latest edit with the previous, stale parse.
    const result = formatJsonText(state.jsonText)
    if (!result) return

    // A validation for the pre-format text may still be pending; let this
    // synchronous, already-validated result win instead.
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current)
    }

    setState((prevState) => ({
      ...prevState,
      jsonText: result.formatted,
      data: result.data,
      isValid: true,
      errorMessage: '',
      isDirty: false,
      issues: [], // Clear warnings after formatting (they're cosmetic)
      isValidating: false,
    }))
    lastValidJsonRef.current = result.formatted
    onValidationChange?.(true)
  }, [state.jsonText, onValidationChange])

  const resetToDefault = useCallback(() => {
    const newInitial = safeParseJson(defaultValue)
    const newJsonText = JSON.stringify(newInitial, null, 2)

    setState({
      data: newInitial,
      jsonText: newJsonText,
      isValid: true,
      errorMessage: '',
      isDirty: false,
      issues: [],
      isValidating: false,
    })

    lastValidJsonRef.current = newJsonText
    onValidationChange?.(true)
  }, [defaultValue, onValidationChange])

  // Update editor when defaultValue changes (store prev in state per React docs)
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue)
  if (prevDefaultValue !== defaultValue) {
    setPrevDefaultValue(defaultValue)
    const newInitial = safeParseJson(defaultValue)
    const newJsonText = JSON.stringify(newInitial, null, 2)
    setState({
      data: newInitial,
      jsonText: newJsonText,
      isValid: true,
      errorMessage: '',
      isDirty: false,
      issues: [],
      isValidating: false,
    })
    // lastValidJsonRef will be updated in an effect below
    onValidationChange?.(true)
  }

  // Keep lastValidJsonRef in sync when defaultValue changes
  useEffect(() => {
    lastValidJsonRef.current = JSON.stringify(safeParseJson(defaultValue), null, 2)
  }, [defaultValue])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [])

  const actions: OptimizedJsonEditorActions = {
    setJsonText,
    formatJson,
    resetToDefault,
  }

  return {
    state,
    actions,
  }
}
