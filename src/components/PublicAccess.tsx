import { useState } from 'react'
import { AlertCircle, Globe, Loader2, Lock } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

type Props = {
  platform: string
  isPublic: boolean
  /** Managers may publish or unpublish; everyone else sees the status. */
  canManage: boolean
  onChange: (isPublic: boolean) => Promise<void>
}

// Public platforms answer the read API without a token, so anyone with the URL can read them.
export default function PublicAccess({ platform, isPublic, canManage, onChange }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const url = `${window.location.origin}/api/${encodeURIComponent(platform)}/<version>`

  async function toggle() {
    setSaving(true)
    setError(null)
    try {
      await onChange(!isPublic)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Public API">
      <div className="space-y-4">
        <p className="flex items-center gap-2 text-sm text-foreground" data-testid="public-status">
          {isPublic
            ? <Globe className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            : <Lock className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />}
          {isPublic ? 'Public: anyone can read this platform without a token.' : 'Private: reads need a session or an API token.'}
        </p>
        <p className="text-sm text-muted-foreground">
          {isPublic
            ? <>Read it with <code className="pt-kbd text-foreground">GET {url}</code>. A version that extends a private platform stays private.</>
            : 'Make it public for configuration that is safe to share, such as values shipped inside an app.'}
        </p>
        {error && (
          <p className="flex items-center gap-2 text-sm text-danger" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            {error}
          </p>
        )}
        {canManage && (
          <Button type="button" variant="secondary" disabled={saving} onClick={toggle}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />}
            {isPublic ? 'Make private' : 'Make public'}
          </Button>
        )}
      </div>
    </Card>
  )
}
