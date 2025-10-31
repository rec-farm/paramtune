'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export interface OptimizedJsonEditorState {
  data: Record<string, unknown>
  jsonText: string
  isValid: boolean
  errorMessage: string
  isDirty: boolean
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
    return {}
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
      }))

      // Clear previous validation timeout
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }

      // Debounced validation
      validationTimeoutRef.current = setTimeout(() => {
        try {
          const parsed = JSON.parse(value)
          setState((prevState) => ({
            ...prevState,
            data: parsed,
            isValid: true,
            errorMessage: '',
            isDirty: false,
          }))
          lastValidJsonRef.current = value
          onValidationChange?.(true)
        } catch (error) {
          setState((prevState) => ({
            ...prevState,
            isValid: false,
            errorMessage:
              error instanceof Error ? error.message : 'Invalid JSON syntax',
          }))
          onValidationChange?.(false)
        }
      }, validationDelay)
    },
    [onValidationChange, validationDelay]
  )

  const formatJson = useCallback(() => {
    if (state.isValid) {
      const formatted = JSON.stringify(state.data, null, 2)
      setState((prevState) => ({
        ...prevState,
        jsonText: formatted,
        isDirty: false,
      }))
      lastValidJsonRef.current = formatted
    }
  }, [state.isValid, state.data])

  const resetToDefault = useCallback(() => {
    const newInitial = safeParseJson(defaultValue)
    const newJsonText = JSON.stringify(newInitial, null, 2)

    setState({
      data: newInitial,
      jsonText: newJsonText,
      isValid: true,
      errorMessage: '',
      isDirty: false,
    })

    lastValidJsonRef.current = newJsonText
    onValidationChange?.(true)
  }, [defaultValue, onValidationChange])

  // Update editor when defaultValue changes
  useEffect(() => {
    const newInitial = safeParseJson(defaultValue)
    const newJsonText = JSON.stringify(newInitial, null, 2)

    setState({
      data: newInitial,
      jsonText: newJsonText,
      isValid: true,
      errorMessage: '',
      isDirty: false,
    })

    lastValidJsonRef.current = newJsonText
    onValidationChange?.(true)
  }, [defaultValue, onValidationChange])

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
