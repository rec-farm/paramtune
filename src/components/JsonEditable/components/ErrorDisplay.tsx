'use client'

import { memo } from 'react'

interface ErrorDisplayProps {
  errorMessage: string
}

export const ErrorDisplay = memo(function ErrorDisplay({
  errorMessage,
}: ErrorDisplayProps) {
  if (!errorMessage) return null

  return (
    <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
      <p className="text-sm text-red-400 font-medium">JSON Syntax Error</p>
      <p className="text-xs text-red-300 mt-1">{errorMessage}</p>
    </div>
  )
})
