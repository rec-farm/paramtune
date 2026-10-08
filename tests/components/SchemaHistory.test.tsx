import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SchemaHistory from '@/components/SchemaHistory'
import type { SchemaHistoryEntry } from '@/shared/contracts'

const HOUR = 60 * 60 * 1000
const now = Date.now()

// Newest first, as returned by the API (ZREVRANGEBYSCORE)
const history: Array<SchemaHistoryEntry & { timestamp: number }> = [
  {
    timestamp: now - 2 * HOUR,
    content: { a: 1, b: 2, c: 3 },
    dependencies: ['web/1.0.0'],
    output: {},
    author: { id: 'u1', name: 'ada lovelace' },
  },
  {
    timestamp: now - 5 * 24 * HOUR,
    content: { a: 1, b: 2 },
    dependencies: [],
    output: {},
    author: { id: 'u2', name: 'Grace Hopper', image: 'https://example.com/grace.png' },
  },
  {
    timestamp: now - 30 * 24 * HOUR,
    content: { a: 1 },
    dependencies: [],
    output: {},
  },
]

function versionButtons() {
  return within(screen.getByRole('list', { name: 'Versions' })).getAllByRole('button')
}

describe('SchemaHistory', () => {
  it('lists every revision newest first with version, author and relative time', () => {
    render(<SchemaHistory history={history} />)

    expect(screen.getByText('revisions saved', { exact: false })).toHaveTextContent('3 revisions saved')

    const [latest, middle, initial] = versionButtons()

    expect(latest).toHaveTextContent('v3')
    expect(latest).toHaveTextContent('Updated')
    expect(latest).toHaveTextContent('Current')
    expect(latest).toHaveTextContent('ada lovelace')
    expect(latest).toHaveTextContent('about 2 hours ago')
    expect(latest).toHaveTextContent('Current version · 3 properties · 1 dependency')

    expect(middle).toHaveTextContent('v2')
    expect(middle).toHaveTextContent('Grace Hopper')
    expect(middle).toHaveTextContent('5 days ago')

    expect(initial).toHaveTextContent('v1')
    expect(initial).toHaveTextContent('Created')
    expect(initial).toHaveTextContent('Unknown')
    expect(initial).toHaveTextContent('Initial schema · 1 property')

    const time = within(latest).getByText('about 2 hours ago')
    expect(time.tagName).toBe('TIME')
    expect(time).toHaveAttribute('dateTime', new Date(history[0].timestamp).toISOString())
  })

  it('describes an update relative to the revision before it', () => {
    render(<SchemaHistory history={history} />)

    // v2 added `b` on top of v1, so it must not be described as a removal
    expect(versionButtons()[1]).toHaveTextContent('Added 1 property · 2 properties')
  })

  it('shows author initials when there is no avatar image', () => {
    render(<SchemaHistory history={history} />)

    expect(within(versionButtons()[0]).getByText('A')).toBeInTheDocument()
  })

  it('shows an empty detail panel until a version is selected', () => {
    render(<SchemaHistory history={history} />)

    expect(screen.getByText('No version selected')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show diff' })).toBeDisabled()
  })

  it('shows the selected revision content and dependencies', async () => {
    const user = userEvent.setup()
    render(<SchemaHistory history={history} />)

    await user.click(versionButtons()[0])

    expect(versionButtons()[0]).toHaveAttribute('aria-current', 'true')
    expect(versionButtons()[1]).not.toHaveAttribute('aria-current')
    expect(screen.getByRole('heading', { name: 'v3' })).toBeInTheDocument()
    expect(screen.getByText(/"c": 3/)).toBeInTheDocument()
    expect(screen.getByText('web/1.0.0')).toBeInTheDocument()

    // The latest version can be neither restored nor diffed against a newer one
    expect(screen.queryByRole('button', { name: 'Restore this version' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show diff' })).toBeDisabled()
  })

  it('toggles a diff against the next newer revision', async () => {
    const user = userEvent.setup()
    render(<SchemaHistory history={history} />)

    await user.click(versionButtons()[1])
    const toggle = screen.getByRole('button', { name: 'Show diff' })
    expect(toggle).toBeEnabled()
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggle)

    expect(screen.getByRole('button', { name: 'Hide diff' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Changes from version 3')).toBeInTheDocument()
    expect(screen.getByText('− 1 removed')).toBeInTheDocument()
    const removed = screen.getByLabelText('Removed').closest('li')
    expect(removed).toHaveTextContent('c')
    expect(removed).toHaveTextContent('3')

    await user.click(screen.getByRole('button', { name: 'Hide diff' }))
    expect(screen.queryByText('Changes from version 3')).not.toBeInTheDocument()
  })

  it('restores an older revision and clears the selection', async () => {
    const user = userEvent.setup()
    const onRestore = vi.fn().mockResolvedValue(undefined)
    render(<SchemaHistory history={history} onRestore={onRestore} />)

    await user.click(versionButtons()[2])
    await user.click(screen.getByRole('button', { name: 'Restore this version' }))

    expect(onRestore).toHaveBeenCalledWith({ a: 1 })
    expect(await screen.findByText('No version selected')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('reports a failed restore and keeps the selection', async () => {
    const user = userEvent.setup()
    const onRestore = vi.fn().mockRejectedValue(new Error('Version conflict'))
    render(<SchemaHistory history={history} onRestore={onRestore} />)

    await user.click(versionButtons()[1])
    await user.click(screen.getByRole('button', { name: 'Restore this version' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Version conflict')
    expect(screen.getByRole('heading', { name: 'v2' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restore this version' })).toBeEnabled()
  })
})
