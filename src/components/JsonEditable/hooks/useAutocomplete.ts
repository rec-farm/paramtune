'use client'

import { useCallback, useRef, useState } from 'react'
import {
  getAutocompleteContext,
  getSuggestions,
  extractExistingKeys,
} from '../utils/autocomplete'
import { EDITOR_CONSTANTS } from '../utils/editorConstants'
import type { AutocompleteSuggestion, UseAutocompleteReturn } from '../types'

export function useAutocomplete(): UseAutocompleteReturn {
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const [userHasNavigated, setUserHasNavigated] = useState(false)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const lastTextRef = useRef('')
  const lastCursorRef = useRef(0)

  const updateSuggestions = useCallback((text: string, cursorPos: number) => {
    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    lastTextRef.current = text
    lastCursorRef.current = cursorPos

    // Debounce suggestion updates
    debounceRef.current = setTimeout(() => {
      const context = getAutocompleteContext(text, cursorPos)
      const existingKeys = extractExistingKeys(text)
      const newSuggestions = getSuggestions(context, existingKeys)

      setSuggestions(newSuggestions)
      setSelectedIndex(0)
      setUserHasNavigated(false) // Reset navigation state when new suggestions appear
      setVisible(newSuggestions.length > 0)
    }, EDITOR_CONSTANTS.DEBOUNCE_MS)
  }, [])

  const selectNext = useCallback(() => {
    setUserHasNavigated(true)
    setSelectedIndex((prev) =>
      prev < suggestions.length - 1 ? prev + 1 : 0
    )
  }, [suggestions.length])

  const selectPrev = useCallback(() => {
    setUserHasNavigated(true)
    setSelectedIndex((prev) =>
      prev > 0 ? prev - 1 : suggestions.length - 1
    )
  }, [suggestions.length])

  const dismiss = useCallback(() => {
    setVisible(false)
    setSuggestions([])
    setSelectedIndex(0)
    setUserHasNavigated(false)
  }, [])

  const acceptSuggestion = useCallback((): AutocompleteSuggestion | null => {
    if (!visible || suggestions.length === 0) {
      return null
    }

    const suggestion = suggestions[selectedIndex]
    dismiss()
    return suggestion || null
  }, [visible, suggestions, selectedIndex, dismiss])

  return {
    suggestions,
    selectedIndex,
    visible,
    position,
    userHasNavigated,
    selectNext,
    selectPrev,
    acceptSuggestion,
    dismiss,
    updateSuggestions,
    setPosition,
  }
}
