import { useId, useState } from 'react'
import { AlertCircle, Loader2, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'

type Props = {
  /** What is deleted, e.g. "platform" or "version". */
  noun: string
  /** The exact name the user types to confirm. */
  confirmName: string
  description: string
  onDelete: () => Promise<void>
}

// Irreversible deletes ask for the name, so a stray click can't remove history.
export default function DeleteZone({ noun, confirmName, description, onDelete }: Props) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function confirm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (typed !== confirmName) return
    setDeleting(true)
    setError(null)
    try {
      await onDelete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setDeleting(false)
    }
  }

  return (
    <Card title={`Delete ${noun}`} className="border-l-4 border-l-danger-icon">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        {!open ? (
          <Button type="button" variant="destructive" onClick={() => setOpen(true)}>
            <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />
            Delete {noun}…
          </Button>
        ) : (
          <form onSubmit={confirm} className="space-y-3" noValidate>
            <label htmlFor={id} className="pt-label block text-foreground">
              Type <code className="font-mono">{confirmName}</code> to confirm
            </label>
            <Input id={id} value={typed} autoComplete="off" className="font-mono max-w-md" onChange={(e) => setTyped(e.target.value)} disabled={deleting} />
            {error && (
              <p className="flex items-center gap-2 text-sm text-danger" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <Button type="submit" variant="destructive" disabled={typed !== confirmName || deleting}>
                {deleting && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />}
                Permanently delete
              </Button>
              <Button type="button" variant="ghost" disabled={deleting} onClick={() => { setOpen(false); setTyped(''); setError(null) }}>Cancel</Button>
            </div>
          </form>
        )}
      </div>
    </Card>
  )
}
