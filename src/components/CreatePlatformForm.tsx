'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Loader2 } from 'lucide-react'
import Input from '@/components/ui/Input'

type Props = {
  action: (formData: FormData) => Promise<void>
}

export default function CreatePlatformForm({ action }: Props) {
  const [name, setName] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()

  const isValid = useMemo(() => {
    return name.trim().length >= 2
  }, [name])

  useEffect(() => {
    setMessage(null)
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
        setMessage('Platform created')
        // Keep focus ready for quick entry
        inputRef.current?.focus()
        // Ensure the server-rendered list updates
        router.refresh()
      } catch (err) {
        console.error('Failed to create platform:', err)
        setMessage(
          `Failed to create platform: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`
        )
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
          className="text-sm font-medium text-foreground"
        >
          Platform Name <span className="text-red-500">*</span>
        </label>
        <Input
          ref={inputRef}
          id="platformName"
          type="text"
          name="platformName"
          placeholder="Enter platform name (e.g., iOS, Android, Web)"
          className="max-w-md"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched(true)}
          required
          aria-required="true"
          aria-invalid={touched && !isValid}
          aria-describedby="platformName-help platformName-error"
          error={touched && !isValid}
        />
        <p id="platformName-help" className="text-xs text-muted-foreground">
          Use letters, numbers, and dashes. Example: ios, android, web
        </p>
        {touched && !isValid && (
          <p id="platformName-error" className="text-xs text-destructive">
            Please enter at least 2 characters
          </p>
        )}
      </div>
      <Button
        type="submit"
        className="w-auto"
        disabled={!isValid || submitting}
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        )}
        {submitting ? 'Creating…' : 'Create Platform'}
      </Button>
      {message && (
        <div role="status" className="text-xs text-green-500">
          {message}
        </div>
      )}
    </form>
  )
}
