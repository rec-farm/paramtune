import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import EmptyState from '@/components/EmptyState'

describe('EmptyState', () => {
  it('renders the title, description and action, hiding the decorative visual', () => {
    render(
      <EmptyState
        visual={<svg data-testid="illustration" />}
        title="No platforms yet"
        description="Create a platform to start versioning its configuration."
        action={<button type="button">Create platform</button>}
      />
    )

    expect(screen.getByRole('heading', { name: 'No platforms yet.' })).toBeInTheDocument()
    expect(screen.getByText('Create a platform to start versioning its configuration.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create platform' })).toBeInTheDocument()
    expect(screen.getByTestId('illustration').parentElement).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders without an action', () => {
    render(<EmptyState visual={null} title="Nothing here" description="Try again later." />)

    expect(screen.getByRole('heading', { name: 'Nothing here.' })).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
