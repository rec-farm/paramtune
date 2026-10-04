import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const DOCKER_COMMAND = 'docker run -d -p 3000:3000 paramtune/paramtune'

export default function QuickStart() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(DOCKER_COMMAND)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section
      id="quickstart"
      aria-labelledby="quickstart-title"
      className="max-w-7xl mx-auto px-4 md:px-6 py-16"
    >
      <div className="mb-8">
        <h2 id="quickstart-title" className="pt-title-2">
          Quick start
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          One command, and you&apos;re tuning.
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="flex items-stretch rounded-sm border border-border bg-surface-2 overflow-hidden">
          <span
            className="flex items-center px-4 border-r border-border font-mono text-meta text-[13px] select-none"
            aria-hidden="true"
          >
            $
          </span>
          <code className="flex-1 flex items-center px-4 py-3 text-[13px] overflow-x-auto whitespace-nowrap">
            {DOCKER_COMMAND}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center w-12 border-l border-border text-muted-foreground hover:bg-surface-2 hover:text-foreground transition-colors duration-150"
            aria-label={copied ? 'Copied' : 'Copy command'}
          >
            {copied ? (
              <Check className="w-4 h-4 text-success" strokeWidth={1.5} />
            ) : (
              <Copy className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
        <span className="sr-only" aria-live="polite">
          {copied ? 'Command copied to clipboard' : ''}
        </span>

        <p className="mt-4 text-base text-muted-foreground">
          Then open{' '}
          <code className="pt-kbd text-foreground">
            http://localhost:3000
          </code>{' '}
          and create your first platform.
        </p>
      </div>
    </section>
  )
}
