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

// Status pill (§8): 24px, full radius, status tile + text, icon as second signal
const badgeClassName =
  'inline-flex items-center gap-1.5 h-6 rounded-full px-2.5 text-xs font-semibold'

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
        className={`${badgeClassName} bg-surface-3 text-muted-foreground`}
      >
        <LoaderCircle
          className="w-3.5 h-3.5 animate-spin motion-reduce:animate-none"
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
        className={`${badgeClassName} bg-danger-soft text-danger`}
      >
        <CircleX className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
        Invalid JSON
      </div>
    )
  }

  // Valid JSON with warnings - show warning icon
  if (warningCount > 0) {
    return (
      <div
        role="status"
        className={`${badgeClassName} bg-warn-soft text-warn`}
      >
        <TriangleAlert className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
        Valid JSON · {warningCount} warning{warningCount > 1 ? 's' : ''}
      </div>
    )
  }

  // Valid JSON with no issues
  return (
    <div
      role="status"
      className={`${badgeClassName} bg-success-soft text-success`}
    >
      <CircleCheck className="w-3.5 h-3.5" strokeWidth={1.5} aria-hidden="true" />
      Valid JSON
    </div>
  )
})
