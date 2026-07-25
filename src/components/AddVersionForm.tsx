'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { Loader2 } from 'lucide-react'
import Input from '@/components/ui/Input'
import { isValidVersion } from '@/lib/versionUtils'

type Props = {
  action: (formData: FormData) => Promise<void>
}

export default function AddVersionForm({ action }: Props) {
  const [version, setVersion] = useState('')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const router = useRouter()

  const isValid = useMemo(() => isValidVersion(version.trim()), [version])

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
        formData.set('versionName', version.trim())
        await action(formData)
        setVersion('')
        setTouched(false)
        setMessage('Version created')
        // Keep focus ready for quick entry
        inputRef.current?.focus()
        // Ensure the server-rendered version list updates
        router.refresh()
      } catch (err) {
        console.error('Failed to create version:', err)
        setMessage(
          `Failed to create version: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`
        )
      } finally {
        setSubmitting(false)
      }
    },
    [action, isValid, version, router]
  )

  return (
    <form onSubmit={onSubmit} className="space-y-2" noValidate>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          id="versionName"
          type="text"
          name="versionName"
          placeholder="Version name (e.g. 1.2.3)"
          className="max-w-md"
          value={version}
          onChange={(e) => {
            setVersion(e.target.value)
            setMessage(null)
          }}
          onBlur={() => setTouched(true)}
          required
          aria-required="true"
          aria-invalid={touched && !isValid}
          aria-describedby="versionName-error"
          error={touched && !isValid}
        />
        <Button type="submit" variant="primary" disabled={!isValid || submitting}>
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Create'
          )}
        </Button>
      </div>
      {touched && !isValid && (
        <p id="versionName-error" className="text-xs text-destructive">
          Must be a valid semantic version, e.g. 1.2.3
        </p>
      )}
      {message && (
        <div role="status" className="text-xs text-green-500">
          {message}
        </div>
      )}
    </form>
  )
}
