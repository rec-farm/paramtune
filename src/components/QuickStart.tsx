'use client'

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
      <div className="mb-8 space-y-2">
        <h2 id="quickstart-title" className="pt-display text-xl">
          Quick start
        </h2>
        <p className="text-muted-foreground">
          Run Paramtune locally with one command.
        </p>
      </div>

      <div className="max-w-2xl">
        <div className="flex items-stretch border border-border bg-surface">
          <span
            className="flex items-center px-4 border-r border-border text-meta text-sm select-none"
            aria-hidden="true"
          >
            $
          </span>
          <code className="flex-1 flex items-center px-4 py-3 text-sm overflow-x-auto whitespace-nowrap">
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

        <p className="mt-4 text-sm text-muted-foreground">
          Then open{' '}
          <code className="px-1 border border-border bg-surface text-foreground">
            http://localhost:3000
          </code>{' '}
          and create your first platform.
        </p>
      </div>
    </section>
  )
}
