'use client'

import JsonView from '@uiw/react-json-view'
import { useEffect, useMemo, useState } from 'react'

type Props = {
  title: string
  name?: string
  defaultValue?: string
}

function safeParseJson(value?: string): Record<string, unknown> {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export default function JsonEditable({ title, name, defaultValue }: Props) {
  const initial = useMemo(() => safeParseJson(defaultValue), [defaultValue])
  const [data, setData] = useState<Record<string, unknown>>(initial)
  const [jsonText, setJsonText] = useState(JSON.stringify(initial, null, 2))
  const [isValid, setIsValid] = useState(true)
  const [mode, setMode] = useState<'visual' | 'text'>('text')
  const [errorMessage, setErrorMessage] = useState('')

  // Update jsonText when defaultValue changes
  useEffect(() => {
    const newInitial = safeParseJson(defaultValue)
    const newJsonText = JSON.stringify(newInitial, null, 2)
    setData(newInitial)
    setJsonText(newJsonText)
    setIsValid(true)
    setErrorMessage('')
  }, [defaultValue])

  const handleTextChange = (value: string) => {
    setJsonText(value)

    try {
      const parsed = JSON.parse(value)
      setData(parsed)
      setIsValid(true)
      setErrorMessage('')
    } catch (error) {
      setIsValid(false)
      setErrorMessage(
        error instanceof Error ? error.message : 'Invalid JSON syntax'
      )
    }
  }

  const formatJson = () => {
    if (isValid) {
      const formatted = JSON.stringify(data, null, 2)
      setJsonText(formatted)
    }
  }

  const addProperty = () => {
    const newData = { ...data, newProperty: 'value' }
    setData(newData)
    setJsonText(JSON.stringify(newData, null, 2))
  }

  return (
    <div className="space-y-4">
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold tracking-tight mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground">
            Edit configuration values in real-time
          </p>
        </div>
      )}

      <input type="hidden" name={name} value={JSON.stringify(data)} />

      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            type="button"
            onClick={() => setMode('text')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === 'text'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Text Editor
          </button>
          <button
            type="button"
            onClick={() => setMode('visual')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              mode === 'visual'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Visual
          </button>
        </div>

        <div className="flex items-center gap-2">
          {isValid ? (
            <div className="flex items-center gap-1 text-green-600 text-xs">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Valid JSON
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-600 text-xs">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Error
            </div>
          )}

          <button
            type="button"
            onClick={formatJson}
            disabled={!isValid}
            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Format
          </button>

          <button
            type="button"
            onClick={addProperty}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Add Property
          </button>
        </div>
      </div>

      {mode === 'text' ? (
        <div className="space-y-2">
          <div className="relative">
            <textarea
              className={`w-full p-4 font-mono text-sm border rounded-lg resize-y transition-colors ${
                !isValid
                  ? 'border-red-300 focus:border-red-500 bg-red-50/50'
                  : 'border-border focus:border-primary bg-background'
              }`}
              style={{
                minHeight: '400px',
                lineHeight: '1.5',
                tabSize: 2,
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              }}
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Enter valid JSON..."
              spellCheck={false}
              onKeyDown={(e) => {
                // Handle Tab key for proper indentation
                if (e.key === 'Tab') {
                  e.preventDefault()
                  const start = e.currentTarget.selectionStart
                  const end = e.currentTarget.selectionEnd
                  const value = e.currentTarget.value
                  const newValue =
                    value.substring(0, start) + '  ' + value.substring(end)
                  handleTextChange(newValue)

                  // Set cursor position after the inserted spaces
                  setTimeout(() => {
                    e.currentTarget.selectionStart =
                      e.currentTarget.selectionEnd = start + 2
                  }, 0)
                }
              }}
            />

            {/* Line numbers */}
            <div className="absolute left-2 top-4 text-xs text-muted-foreground/60 pointer-events-none select-none">
              {jsonText.split('\n').map((_, index) => (
                <div key={index} style={{ lineHeight: '1.5' }}>
                  {index + 1}
                </div>
              ))}
            </div>
          </div>

          {!isValid && errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700 font-medium">
                JSON Syntax Error
              </p>
              <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="border border-border rounded-lg p-4 bg-background min-h-[400px]">
          <JsonView
            value={data}
            displayDataTypes={false}
            enableClipboard={true}
            collapsed={1}
            style={
              {
                backgroundColor: 'transparent',
                fontSize: '14px',
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                '--w-rjv-background-color': 'transparent',
                '--w-rjv-color': 'var(--foreground)',
                '--w-rjv-key-string': 'var(--primary)',
                '--w-rjv-type-string-color': '#22c55e',
                '--w-rjv-type-int-color': '#3b82f6',
                '--w-rjv-type-float-color': '#3b82f6',
                '--w-rjv-type-boolean-color': '#a855f7',
              } as any
            }
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/30">
        <button
          type="button"
          onClick={() => {
            const minified = JSON.stringify(data)
            setJsonText(minified)
          }}
          disabled={!isValid}
          className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Minify
        </button>

        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(jsonText)}
          className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground hover:text-foreground"
        >
          Copy
        </button>

        <button
          type="button"
          onClick={() => {
            const file = new Blob([jsonText], { type: 'application/json' })
            const url = URL.createObjectURL(file)
            const a = document.createElement('a')
            a.href = url
            a.download = 'config.json'
            a.click()
            URL.revokeObjectURL(url)
          }}
          className="text-xs px-2 py-1 bg-muted hover:bg-muted/80 rounded text-muted-foreground hover:text-foreground"
        >
          Download
        </button>
      </div>
    </div>
  )
}
