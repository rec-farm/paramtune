'use client'

import { memo } from 'react'

interface ValidationStatusProps {
  isValid: boolean
  errorMessage?: string
}

export const ValidationStatus = memo(function ValidationStatus({
  isValid,
  errorMessage,
}: ValidationStatusProps) {
  if (isValid) {
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
  }

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
})
