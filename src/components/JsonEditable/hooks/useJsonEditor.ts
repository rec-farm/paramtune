'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

export interface JsonEditorState {
  data: Record<string, unknown>
  jsonText: string
  isValid: boolean
  errorMessage: string
}

export interface JsonEditorActions {
  setJsonText: (text: string) => void
  formatJson: () => void
  resetToDefault: () => void
}

export interface UseJsonEditorOptions {
  defaultValue?: string
  onValidationChange?: (isValid: boolean) => void
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

export function useJsonEditor({
  defaultValue,
  onValidationChange,
}: UseJsonEditorOptions) {
  const initial = useMemo(() => safeParseJson(defaultValue), [defaultValue])

  const [state, setState] = useState<JsonEditorState>({
    data: initial,
    jsonText: JSON.stringify(initial, null, 2),
    isValid: true,
    errorMessage: '',
  })

  // Update editor when defaultValue changes
  useEffect(() => {
    const newInitial = safeParseJson(defaultValue)
    const newJsonText = JSON.stringify(newInitial, null, 2)

    setState({
      data: newInitial,
      jsonText: newJsonText,
      isValid: true,
      errorMessage: '',
    })

    onValidationChange?.(true)
  }, [defaultValue, onValidationChange])

  const setJsonText = useCallback(
    (value: string) => {
      let isValid = true
      let errorMessage = ''
      let data: Record<string, unknown> = {}

      try {
        data = JSON.parse(value)
        isValid = true
        errorMessage = ''
      } catch (error) {
        isValid = false
        errorMessage =
          error instanceof Error ? error.message : 'Invalid JSON syntax'
      }

      setState((prevState) => ({
        ...prevState,
        data,
        jsonText: value,
        isValid,
        errorMessage,
      }))

      // Call onValidationChange after state update
      onValidationChange?.(isValid)
    },
    [onValidationChange]
  )

  const formatJson = useCallback(() => {
    if (state.isValid) {
      const formatted = JSON.stringify(state.data, null, 2)
      setState((prevState) => ({
        ...prevState,
        jsonText: formatted,
      }))
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
    })

    onValidationChange?.(true)
  }, [defaultValue, onValidationChange])

  const actions: JsonEditorActions = {
    setJsonText,
    formatJson,
    resetToDefault,
  }

  return {
    state,
    actions,
  }
}
