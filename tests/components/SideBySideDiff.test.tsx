import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SideBySideDiff from '@/components/SchemaDiff/SideBySideDiff'
import { calculateDiff } from '@/lib/schemaDiff'

const schemaA = {
  name: 'checkout',
  retries: 3,
  legacyFlag: true,
  limits: { perPage: 20 },
}

const schemaB = {
  name: 'checkout',
  retries: '5',
  limits: { perPage: 50, maxItems: 100 },
  theme: 'dark',
}

function renderDiff(a: Record<string, unknown>, b: Record<string, unknown>) {
  // The compare page diffs B (current) against A (previous)
  return render(
    <SideBySideDiff
      schemaA={a}
      schemaB={b}
      diffResult={calculateDiff(b, a)}
      labelA="ios/1.0.0"
      labelB="ios/1.1.0"
    />
  )
}

function changeGroup(heading: string) {
  const group = screen.getByRole('heading', { name: heading }).parentElement
  if (!group) throw new Error(`No group for ${heading}`)
  return group
}

describe('SideBySideDiff', () => {
  it('shows a success status when the schemas are identical', () => {
    renderDiff(schemaA, { ...schemaA })

    expect(screen.getByRole('status')).toHaveTextContent(
      'All in tune. These schemas are identical.'
    )
    expect(screen.queryByText('Detailed changes')).not.toBeInTheDocument()
  })

  it('summarises the number of added, removed and changed entries', () => {
    renderDiff(schemaA, schemaB)

    expect(screen.getByText('+ 2 added')).toBeInTheDocument()
    expect(screen.getByText('− 1 removed')).toBeInTheDocument()
    // The parent `limits` object counts as changed alongside `limits.perPage`
    expect(screen.getByText('~ 3 changed')).toBeInTheDocument()
  })

  it('lists added entries with their new values', () => {
    renderDiff(schemaA, schemaB)

    const added = changeGroup('+ Added')
    expect(within(added).getByText('theme')).toBeInTheDocument()
    expect(within(added).getByText('"dark"')).toBeInTheDocument()
    expect(within(added).getByText('limits.maxItems')).toBeInTheDocument()
    expect(within(added).getByText('100')).toBeInTheDocument()
  })

  it('lists removed entries with their old values', () => {
    renderDiff(schemaA, schemaB)

    const removed = changeGroup('− Removed')
    expect(within(removed).getByText('legacyFlag')).toBeInTheDocument()
    expect(within(removed).getByText('true')).toBeInTheDocument()
    expect(within(removed).queryByText('theme')).not.toBeInTheDocument()
  })

  it('lists changed entries with old and new values and type changes', () => {
    renderDiff(schemaA, schemaB)

    const changed = changeGroup('~ Changed')
    expect(within(changed).getByText('limits.perPage')).toBeInTheDocument()
    expect(within(changed).getByText('20')).toBeInTheDocument()
    expect(within(changed).getByText('50')).toBeInTheDocument()

    expect(within(changed).getByText('retries')).toBeInTheDocument()
    expect(within(changed).getByText('(type: number → string)')).toBeInTheDocument()
    expect(within(changed).getByText('"5"')).toBeInTheDocument()

    // Unchanged keys are not listed
    expect(within(changed).queryByText('name')).not.toBeInTheDocument()
  })

  it('omits groups that have no entries', () => {
    renderDiff({ a: 1 }, { a: 1, b: 2 })

    expect(screen.getByRole('heading', { name: '+ Added' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '− Removed' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: '~ Changed' })).not.toBeInTheDocument()
  })

  it('marks changed lines in the side-by-side and unified views', () => {
    renderDiff(schemaA, schemaB)

    // Side-by-side: added keys only on the right, removed only on the left
    expect(screen.getAllByLabelText('added').map((el) => el.parentElement?.textContent))
      .toEqual(expect.arrayContaining([expect.stringContaining('"theme": "dark"')]))
    expect(screen.getAllByLabelText('removed').map((el) => el.parentElement?.textContent))
      .toEqual(expect.arrayContaining([expect.stringContaining('"legacyFlag": true')]))

    // Unified view shows both sides of a modified value
    const oldLines = screen.getAllByLabelText('changed, old value').map((el) => el.parentElement?.textContent)
    const newLines = screen.getAllByLabelText('changed, new value').map((el) => el.parentElement?.textContent)
    expect(oldLines).toEqual([
      expect.stringContaining('"retries": 3'),
      expect.stringContaining('"perPage": 20'),
    ])
    expect(newLines).toEqual([
      expect.stringContaining('"retries": "5"'),
      expect.stringContaining('"perPage": 50'),
    ])

    expect(screen.getAllByText('ios/1.0.0').length).toBeGreaterThan(0)
    expect(screen.getAllByText('ios/1.1.0').length).toBeGreaterThan(0)
  })
})
