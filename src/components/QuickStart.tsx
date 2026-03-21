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
    <section
      id="quickstart"
      className="relative mx-auto max-w-7xl px-6 py-16 md:py-20"
    >
      <div className="text-center mb-10 md:mb-12">
        <h2 className="text-4xl md:text-5xl font-display font-bold tracking-widest uppercase mb-4">
          QUICK_START
        </h2>
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="h-px w-16 bg-primary/30" />
          <p className="text-sm text-gray-500 font-fragmented uppercase tracking-wider">
            Get ParamTune running locally in seconds
          </p>
          <div className="h-px w-16 bg-primary/30" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="relative group">
          <div className="flex items-center border border-primary/30 bg-black/60 hover:border-primary/50 transition-colors overflow-hidden">
            <div className="px-4 py-3 bg-primary/10 border-r-2 border-primary/40 text-primary text-sm font-fragmented font-bold">
              $
            </div>
            <code className="flex-1 px-4 py-3 text-sm font-fragmented overflow-x-auto">
              {DOCKER_COMMAND}
            </code>
            <button
              onClick={handleCopy}
              className="px-4 py-3 text-gray-500 hover:text-primary transition-colors border-l-2 border-primary/40 hover:bg-primary/10"
              aria-label="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-primary" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500 font-fragmented">
          Then open{' '}
          <code className="px-2 py-1 bg-primary/10 font-fragmented text-xs border border-primary/30 text-primary">
            http://localhost:3000
          </code>{' '}
          and create your first platform.
        </p>
      </div>
    </section>
  )
}
