'use client'

import { memo } from 'react'
import type { ValidationIssue } from '../types'

interface ErrorDisplayProps {
  errorMessage?: string
  issues?: ValidationIssue[]
}

export const ErrorDisplay = memo(function ErrorDisplay({
  errorMessage,
  issues = [],
}: ErrorDisplayProps) {
  const errors = issues.filter((i) => i.type === 'error')
  const warnings = issues.filter((i) => i.type === 'warning')

  // Backwards compatibility: if errorMessage is provided but no issues, show it
  const hasLegacyError = errorMessage && errors.length === 0

  if (!hasLegacyError && errors.length === 0 && warnings.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {/* Errors section */}
      {(errors.length > 0 || hasLegacyError) && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          <p className="text-sm text-red-400 font-medium">
            {errors.length > 0
              ? `JSON Syntax Error${errors.length > 1 ? 's' : ''}`
              : 'JSON Syntax Error'}
          </p>
          {hasLegacyError && (
            <p className="text-xs text-red-300 mt-1">{errorMessage}</p>
          )}
          {errors.map((error, index) => (
            <p key={index} className="text-xs text-red-300 mt-1">
              {error.line && error.column && (
                <span className="text-red-400">
                  Line {error.line}, Col {error.column}:{' '}
                </span>
              )}
              {error.message}
            </p>
          ))}
        </div>
      )}

      {/* Warnings section */}
      {warnings.length > 0 && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3">
          <p className="text-sm text-amber-400 font-medium">
            Warning{warnings.length > 1 ? 's' : ''}
          </p>
          {warnings.map((warning, index) => (
            <p key={index} className="text-xs text-amber-300 mt-1">
              {warning.line && warning.column && (
                <span className="text-amber-400">
                  Line {warning.line}, Col {warning.column}:{' '}
                </span>
              )}
              {warning.message}
            </p>
          ))}
        </div>
      )}
    </div>
  )
})
