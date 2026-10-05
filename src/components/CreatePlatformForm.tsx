import { useCallback, useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { AlertCircle, CheckCircle2, Loader2, Plus } from 'lucide-react'
import Input from '@/components/ui/Input'
import PlatformIcon, { PLATFORM_TYPES } from '@/components/PlatformIcon'
import type { PlatformKind } from '@/shared/contracts'
import { isValidName } from '@/lib/nameValidation'

type Props = {
  action: (formData: FormData) => Promise<void>
}

export default function CreatePlatformForm({ action }: Props) {
  const [name, setName] = useState('')
  const [kind, setKind] = useState<PlatformKind>('custom')
  const [touched, setTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{
    kind: 'success' | 'error'
    text: string
  } | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

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
        // Submit the mutation supplied by the route
        const formData = new FormData()
        formData.set('platformName', name.trim())
        formData.set('kind', kind)
        await action(formData)
        setName('')
        setTouched(false)
        setMessage({ kind: 'success', text: 'Platform created. Add its first version next.' })
        // Keep focus ready for quick entry
        inputRef.current?.focus()
      } catch (err) {
        console.error('Failed to create platform:', err)
        setMessage({
          kind: 'error',
          text: `We couldn't create the platform: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
        })
      } finally {
        setSubmitting(false)
      }
    },
    [action, isValid, name, kind]
  )

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <fieldset disabled={submitting} className="space-y-3">
        <legend className="pt-label mb-2">Platform type</legend>
        <p className="text-sm text-muted-foreground">Choose what this configuration is for. The type helps you recognize it; your name stays its API identifier.</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_TYPES.map((type) => (
            <label key={type.kind} className="flex cursor-pointer items-start gap-3 rounded-sm border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
              <input type="radio" name="kind" value={type.kind} checked={kind === type.kind} onChange={() => {
                setKind(type.kind)
                if (!name.trim()) setName(type.name)
                setMessage(null)
              }} className="mt-1" />
              <PlatformIcon kind={type.kind} />
              <span><span className="block font-semibold">{type.label}</span><span className="block text-xs text-muted-foreground">{type.description}</span></span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="space-y-2">
        <label
          htmlFor="platformName"
          className="pt-label block text-foreground mb-2"
        >
          Platform name
          <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" aria-hidden="true" />
          <span className="sr-only">(required)</span>
        </label>
        <Input
          ref={inputRef}
          id="platformName"
          type="text"
          name="platformName"
          placeholder="ios"
          className="font-mono max-w-md"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setMessage(null)
          }}
          onBlur={() => setTouched(true)}
          disabled={submitting}
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
