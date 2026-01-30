'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const DOCKER_COMMAND = 'docker run -d -p 3000:3000 paramtune/paramtune'

export default function QuickStart() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(DOCKER_COMMAND)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="quickstart" className="relative mx-auto max-w-6xl px-6 py-16 md:py-20">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-3">
          Quick Start
        </h2>
        <p className="text-muted-foreground">
          Get ParamTune running locally in seconds.
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="relative group">
          <div className="flex items-center rounded-lg border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 bg-muted/50 border-r border-border text-muted-foreground text-sm font-mono">
              $
            </div>
            <code className="flex-1 px-4 py-3 text-sm font-mono overflow-x-auto">
              {DOCKER_COMMAND}
            </code>
            <button
              onClick={handleCopy}
              className="px-4 py-3 text-muted-foreground hover:text-foreground transition-colors border-l border-border hover:bg-muted/50"
              aria-label="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Then open{' '}
          <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">
            http://localhost:3000
          </code>{' '}
          and create your first platform.
        </p>
      </div>
    </section>
  )
}
