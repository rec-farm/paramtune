'use client'

import { memo } from 'react'

interface ActionButtonsProps {
  isValid: boolean
  onFormat: () => void
  onCopy: () => void
  onDownload: () => void
}

export const ActionButtons = memo(function ActionButtons({
  isValid,
  onFormat,
  onCopy,
  onDownload,
}: ActionButtonsProps) {
  const buttonClassName =
    'text-sm px-3 py-1.5 bg-muted hover:bg-muted/80 rounded text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
  const smallButtonClassName =
    'text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <>
      {/* Main Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onFormat}
          disabled={!isValid}
          className={buttonClassName}
        >
          Format
        </button>

        <button
          type="button"
          onClick={onCopy}
          disabled={!isValid}
          className={buttonClassName}
        >
          Copy
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
        <button
          type="button"
          onClick={onDownload}
          disabled={!isValid}
          className={smallButtonClassName}
        >
          Download
        </button>
      </div>
    </>
  )
})
