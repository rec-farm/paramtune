'use client'

import { memo } from 'react'
import type { ValidationIssue } from '../types'

interface ValidationStatusProps {
  isValid: boolean
  errorMessage?: string
  issues?: ValidationIssue[]
}

export const ValidationStatus = memo(function ValidationStatus({
  isValid,
  errorMessage,
  issues = [],
}: ValidationStatusProps) {
  const warningCount = issues.filter((i) => i.type === 'warning').length

  // Invalid JSON - show error
  if (!isValid) {
    return (
      <div className="flex items-center gap-1 text-red-600 text-sm">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        Invalid JSON
      </div>
    )
  }

  // Valid JSON with warnings - show warning icon
  if (warningCount > 0) {
    return (
      <div className="flex items-center gap-1 text-amber-500 text-sm">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        Valid JSON
        <span className="text-xs text-amber-400">
          ({warningCount} warning{warningCount > 1 ? 's' : ''})
        </span>
      </div>
    )
  }

  // Valid JSON with no issues
  return (
    <div className="flex items-center gap-1 text-green-600 text-sm">
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
      Valid JSON
    </div>
  )
})
