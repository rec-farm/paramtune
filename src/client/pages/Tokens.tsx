import { useState } from 'react'
import { useLoaderData, useRevalidator } from 'react-router'
import { formatDistanceToNow } from 'date-fns'
import { AlertCircle, Check, Copy, KeyRound, Loader2, Plus } from 'lucide-react'
import { api, UI_API } from '@/client/api'
import type { ApiToken, CreatedApiToken, Platform } from '@/shared/contracts'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import EmptyState from '@/components/EmptyState'

type TokensData = { tokens: ApiToken[], platforms: Platform[] }

const ago = (timestamp: number) => formatDistanceToNow(timestamp, { addSuffix: true })

function CreatedToken({ created, onDone }: { created: CreatedApiToken, onDone: () => void }) {
  const [copied, setCopied] = useState(false)
  return (
    <Card className="p-6 space-y-4 border-t-[3px] border-t-accent" role="status">
      <h2 className="pt-title-3">Copy your new token</h2>
      <p className="text-sm text-muted-foreground">This is the only time it is shown. Store it in your service’s secret manager.</p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="font-mono text-sm break-all rounded-sm border border-border bg-surface-2 px-3 py-2" data-testid="new-token">{created.token}</code>
        <Button type="button" variant="secondary" onClick={async () => {
          try {
            await navigator.clipboard.writeText(created.token)
            setCopied(true)
          } catch { /* the token stays selectable */ }
        }}>
          {copied ? <Check className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" /> : <Copy className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />}
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>
      <pre className="font-mono text-xs overflow-x-auto rounded-sm bg-surface-2 p-3">{`curl -H "Authorization: Bearer ${created.token}" \\\n  ${window.location.origin}/api/schemas`}</pre>
      <Button type="button" onClick={onDone}>Done</Button>
    </Card>
  )
}

function CreateTokenForm({ platforms, onCreated }: { platforms: Platform[], onCreated: (created: CreatedApiToken) => void }) {
  const [name, setName] = useState('')
  const [scope, setScope] = useState<'all' | 'some'>('all')
  const [selected, setSelected] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const valid = name.trim().length > 0 && name.trim().length <= 64 && (scope === 'all' || selected.length > 0)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!valid) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await api<CreatedApiToken>(`${UI_API}/tokens`, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), ...(scope === 'some' ? { platforms: selected } : {}) }),
      })
      setName('')
      setSelected([])
      onCreated(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <label htmlFor="tokenName" className="pt-label block text-foreground">Token name</label>
        <Input id="tokenName" value={name} maxLength={64} placeholder="ios-release-pipeline" className="max-w-md" onChange={(e) => setName(e.target.value)} disabled={submitting} />
        <p className="text-xs text-muted-foreground">Name it after the service or job that will use it.</p>
      </div>
      <fieldset disabled={submitting} className="space-y-2">
        <legend className="pt-label mb-2">Platforms it can read</legend>
        <label className="flex items-center gap-2 text-sm"><input type="radio" name="scope" checked={scope === 'all'} onChange={() => setScope('all')} />All platforms, including future ones</label>
        <label className="flex items-center gap-2 text-sm"><input type="radio" name="scope" checked={scope === 'some'} onChange={() => setScope('some')} />Only selected platforms</label>
        {scope === 'some' && (
          <div className="flex flex-wrap gap-3 pl-6">
            {platforms.length === 0 && <p className="text-sm text-muted-foreground">Create a platform first.</p>}
            {platforms.map((platform) => (
              <label key={platform.name} className="flex items-center gap-2 font-mono text-sm">
                <input type="checkbox" checked={selected.includes(platform.name)} onChange={(e) => setSelected((current) => e.target.checked ? [...current, platform.name] : current.filter((p) => p !== platform.name))} />
                {platform.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>
      {error && (
        <p className="flex items-center gap-2 text-sm text-danger" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
          We couldn’t create the token: {error}
        </p>
      )}
      <Button type="submit" disabled={!valid || submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} aria-hidden="true" /> : <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden="true" />}
        Create token
      </Button>
    </form>
  )
}

export default function TokensPage() {
  const { tokens, platforms } = useLoaderData() as TokensData
  const revalidator = useRevalidator()
  const [created, setCreated] = useState<CreatedApiToken | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function revoke(token: ApiToken) {
    setRevoking(token.id)
    setError(null)
    try {
      await api(`${UI_API}/tokens/${encodeURIComponent(token.id)}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' } })
      await revalidator.revalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setRevoking(null)
    }
  }

  return (
    <div className="space-y-8">
      <header className="pt-4 md:pt-8">
        <p className="pt-eyebrow">Settings</p>
        <h1 className="pt-title-1 mt-2">API tokens<span className="pt-period">.</span></h1>
        <p className="mt-3 max-w-[60ch] text-lg text-muted-foreground">
          Read-only tokens let services and CI jobs fetch resolved configuration with an <code className="font-mono text-base">Authorization: Bearer</code> header. They can’t change anything.
        </p>
      </header>

      {created
        ? <CreatedToken created={created} onDone={() => setCreated(null)} />
        : (
          <Card className="p-6 space-y-4">
            <h2 className="pt-title-3">New token</h2>
            <CreateTokenForm platforms={platforms} onCreated={(value) => { setCreated(value); void revalidator.revalidate() }} />
          </Card>
        )}

      <section className="space-y-3" aria-labelledby="active-tokens">
        <h2 id="active-tokens" className="pt-title-3">Active tokens</h2>
        {error && <p className="text-sm text-danger" role="alert">We couldn’t revoke the token: {error}</p>}
        {tokens.length === 0
          ? <EmptyState visual={<KeyRound className="h-12 w-12 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />} title="No tokens yet" description="Create one above for each service that reads configuration." />
          : (
            <ul className="divide-y divide-border rounded-sm border border-border">
              {tokens.map((token) => (
                <li key={token.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold">{token.name} <span className="font-mono text-xs text-muted-foreground">ptk_…{token.hint}</span></p>
                    <p className="text-xs text-muted-foreground">
                      {token.platforms ? <>Reads <span className="font-mono">{token.platforms.join(', ')}</span></> : 'Reads all platforms'}
                      {' · '}Created {ago(token.createdAt)}{token.createdBy.name ? ` by ${token.createdBy.name}` : ''}
                      {' · '}{token.lastUsedAt ? `Last used ${ago(token.lastUsedAt)}` : 'Never used'}
                    </p>
                  </div>
                  <Button type="button" variant="secondary" disabled={revoking === token.id} onClick={() => void revoke(token)} aria-label={`Revoke ${token.name}`}>
                    {revoking === token.id && <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />}
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
          )}
      </section>
    </div>
  )
}
