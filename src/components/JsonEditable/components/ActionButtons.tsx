import { memo } from 'react'
import { Braces, Copy, Download } from 'lucide-react'

interface ActionButtonsProps {
  isValid: boolean
  onFormat: () => void
  onCopy: () => void
  onDownload: () => void
}

const buttonClassName = 'pt-btn pt-btn-secondary h-7 px-2.5 text-[13px]'

export const ActionButtons = memo(function ActionButtons({
  isValid,
  onFormat,
  onCopy,
  onDownload,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={onFormat}
        disabled={!isValid}
        className={buttonClassName}
      >
        <Braces className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
        Format
      </button>

      <button
        type="button"
        onClick={onCopy}
        disabled={!isValid}
        className={buttonClassName}
      >
        <Copy className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
        Copy
      </button>

      <button
        type="button"
        onClick={onDownload}
        disabled={!isValid}
        className={buttonClassName}
      >
        <Download className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
        Download
      </button>
    </div>
  )
})
