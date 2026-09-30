'use client'

import { memo } from 'react'
import { CircleAlert, TriangleAlert } from 'lucide-react'
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
        <div
          role="alert"
          className="flex gap-2 border border-danger/40 bg-danger/10 p-3"
        >
          <CircleAlert
            className="w-4 h-4 mt-0.5 shrink-0 text-danger"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-bold text-danger">
              {errors.length > 1 ? 'JSON syntax errors' : 'JSON syntax error'}
            </p>
            {hasLegacyError && (
              <p className="text-xs text-foreground">{errorMessage}</p>
            )}
            {errors.map((error, index) => (
              <p key={index} className="text-xs text-foreground">
                {error.line && error.column && (
                  <span className="text-muted-foreground tabular-nums">
                    Line {error.line}, col {error.column}:{' '}
                  </span>
                )}
                {error.message}
              </p>
            ))}
            <p className="text-xs text-muted-foreground">
              Fix the marked line, then save again.
            </p>
          </div>
        </div>
      )}

      {/* Warnings section */}
      {warnings.length > 0 && (
        <div className="flex gap-2 border border-warn/40 bg-warn/10 p-3">
          <TriangleAlert
            className="w-4 h-4 mt-0.5 shrink-0 text-warn"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-bold text-warn">
              Warning{warnings.length > 1 ? 's' : ''}
            </p>
            {warnings.map((warning, index) => (
              <p key={index} className="text-xs text-foreground">
                {warning.line && warning.column && (
                  <span className="text-muted-foreground tabular-nums">
                    Line {warning.line}, col {warning.column}:{' '}
                  </span>
                )}
                {warning.message}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})
