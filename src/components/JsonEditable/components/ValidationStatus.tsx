'use client'

import { memo } from 'react'
import {
  CircleCheck,
  CircleX,
  LoaderCircle,
  TriangleAlert,
} from 'lucide-react'
import type { ValidationIssue } from '../types'

interface ValidationStatusProps {
  isValid: boolean
  errorMessage?: string
  issues?: ValidationIssue[]
  isValidating?: boolean
}

const badgeClassName =
  'inline-flex items-center gap-1 border px-2 py-0.5 text-xs font-bold uppercase tracking-[0.08em]'

export const ValidationStatus = memo(function ValidationStatus({
  isValid,
  issues = [],
  isValidating = false,
}: ValidationStatusProps) {
  const warningCount = issues.filter((i) => i.type === 'warning').length

  // Validating state - show subtle indicator
  if (isValidating && isValid) {
    return (
      <div
        role="status"
        className={`${badgeClassName} border-border-strong text-muted-foreground`}
      >
        <LoaderCircle
          className="w-4 h-4 animate-spin motion-reduce:animate-none"
          strokeWidth={1.5}
          aria-hidden="true"
        />
        Validating
      </div>
    )
  }

  // Invalid JSON - show error
  if (!isValid) {
    return (
      <div
        role="status"
        className={`${badgeClassName} border-danger/40 bg-danger/10 text-danger`}
      >
        <CircleX className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
        Invalid JSON
      </div>
    )
  }

  // Valid JSON with warnings - show warning icon
  if (warningCount > 0) {
    return (
      <div
        role="status"
        className={`${badgeClassName} border-warn/40 bg-warn/10 text-warn`}
      >
        <TriangleAlert className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
        Valid JSON · {warningCount} warning{warningCount > 1 ? 's' : ''}
      </div>
    )
  }

  // Valid JSON with no issues
  return (
    <div
      role="status"
      className={`${badgeClassName} border-success/40 bg-success/10 text-success`}
    >
      <CircleCheck className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
      Valid JSON
    </div>
  )
})
