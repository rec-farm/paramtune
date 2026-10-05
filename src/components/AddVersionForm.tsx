import { useCallback, useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import Input from '@/components/ui/Input'
import { isValidVersion } from '@/lib/versionUtils'

type Props = {
  initialVersion?: string
  action: (formData: FormData) => Promise<void>
}

export default function AddVersionForm({ action, initialVersion = '' }: Props) {
  const [version, setVersion] = useState(initialVersion)
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{
    kind: 'success' | 'error'
    text: string
  } | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

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
        // Submit the mutation supplied by the route
        const formData = new FormData()
        formData.set('versionName', version.trim())
        await action(formData)
        setVersion('')
        setTouched(false)
        setMessage({ kind: 'success', text: 'Version created. Its schema starts at {}.' })
        // Keep focus ready for quick entry
        inputRef.current?.focus()
      } catch (err) {
        console.error('Failed to create version:', err)
        setMessage({
          kind: 'error',
          text: `We couldn't create the version: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
        })
      } finally {
        setSubmitting(false)
      }
    },
    [action, isValid, version]
  )

  return (
    <form onSubmit={onSubmit} className="space-y-2" noValidate>
      <label htmlFor="versionName" className="pt-label block text-foreground mb-2">
        Version
          <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" aria-hidden="true" />
          <span className="sr-only">(required)</span>
      </label>
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          id="versionName"
          type="text"
          name="versionName"
          placeholder="1.2.3"
          className="font-mono max-w-md"
          value={version}
          onChange={(e) => {
            setVersion(e.target.value)
            setMessage(null)
          }}
          onBlur={() => setTouched(true)}
          disabled={submitting}
          required
          aria-required="true"
          aria-invalid={touched && !isValid}
          aria-describedby="versionName-help versionName-error"
          error={touched && !isValid}
        />
        <Button
          type="submit"
          variant="primary"
          disabled={!isValid || submitting}
          aria-busy={submitting}
        >
          {submitting && (
            <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />
          )}
          Create
        </Button>
      </div>
      <p id="versionName-help" className="text-xs text-muted-foreground">
        A version identifies a release of this configuration. Use major.minor.patch, such as 1.0.0 for your first release.
      </p>
      {touched && !isValid && (
        <p id="versionName-error" className="flex items-center gap-2 text-xs text-danger">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          Enter a semantic version such as 1.2.3.
        </p>
      )}
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
