'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { AlertCircle, CheckCircle2, Loader2, Plus } from 'lucide-react'
import Input from '@/components/ui/Input'
import { isValidName } from '@/lib/nameValidation'

type Props = {
  action: (formData: FormData) => Promise<void>
}

export default function CreatePlatformForm({ action }: Props) {
  const [name, setName] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{
    kind: 'success' | 'error'
    text: string
  } | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()

  const isValid = useMemo(() => {
    const trimmed = name.trim()
    return trimmed.length >= 2 && isValidName(trimmed)
  }, [name])

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      if (!isValid) {
        e.preventDefault()
        setTouched(true)
        return
      }

      e.preventDefault()
      setSubmitting(true)
      try {
        // Build FormData and call server action
        const formData = new FormData()
        formData.set('platformName', name.trim())
        await action(formData)
        setName('')
        setTouched(false)
        setMessage({ kind: 'success', text: 'Platform created' })
        // Keep focus ready for quick entry
        inputRef.current?.focus()
        // Ensure the server-rendered list updates
        router.refresh()
      } catch (err) {
        console.error('Failed to create platform:', err)
        setMessage({
          kind: 'error',
          text: `Failed to create platform: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
        })
      } finally {
        setSubmitting(false)
      }
    },
    [action, isValid, name, router]
  )

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label
          htmlFor="platformName"
          className="pt-label block text-foreground"
        >
          Platform name <span className="text-primary" aria-hidden="true">*</span>
        </label>
        <Input
          ref={inputRef}
          id="platformName"
          type="text"
          name="platformName"
          placeholder="ios"
          className="max-w-md"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setMessage(null)
          }}
          onBlur={() => setTouched(true)}
          required
          aria-required="true"
          aria-invalid={touched && !isValid}
          aria-describedby="platformName-help platformName-error"
          error={touched && !isValid}
        />
        <p id="platformName-help" className="text-xs text-muted-foreground">
          Use letters, numbers, dots, dashes, and underscores. Example: ios, android, web
        </p>
        {touched && !isValid && (
          <p id="platformName-error" className="flex items-center gap-2 text-xs text-danger">
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            Use 2-128 characters: letters, numbers, dots, dashes, and underscores only.
          </p>
        )}
      </div>
      <Button
        type="submit"
        className="w-auto"
        disabled={!isValid || submitting}
        aria-busy={submitting}
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />
        ) : (
          <Plus className="w-4 h-4" strokeWidth={1.5} aria-hidden="true" />
        )}
        {submitting ? 'Creating' : 'Create platform'}
      </Button>
      {message && (
        <p
          role="status"
          className={`flex items-center gap-2 text-xs ${
            message.kind === 'error' ? 'text-danger' : 'text-success'
          }`}
        >
          {message.kind === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          )}
          {message.text}
        </p>
      )}
    </form>
  )
}
