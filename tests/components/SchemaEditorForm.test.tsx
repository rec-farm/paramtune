import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import SchemaEditorForm from '@/components/SchemaEditorForm'

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderForm(props: { defaultValue?: string; firstSave?: boolean } = {}) {
  const updateSchema = vi.fn<(formData: FormData) => Promise<void>>().mockResolvedValue()
  render(
    <SchemaEditorForm
      defaultValue={props.defaultValue ?? '{"retries":3}'}
      firstSave={props.firstSave}
      updateSchema={updateSchema}
    />
  )
  return { updateSchema, textarea: screen.getByRole('textbox') as HTMLTextAreaElement }
}

describe('SchemaEditorForm', () => {
  it('validates dependencies with the API before saving', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetch(200, { valid: true, errors: [] })
    const { updateSchema } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(updateSchema).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/_ui/v1/validate',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ content: { retries: 3 } }),
        credentials: 'same-origin',
      })
    )
    const formData = updateSchema.mock.calls[0][0]
    expect(JSON.parse(formData.get('content') as string)).toEqual({ retries: 3 })
  })

  it('shows dependency errors and does not save', async () => {
    const user = userEvent.setup()
    mockFetch(200, { valid: false, errors: ['Unknown schema: ios/9.9.9'] })
    const { updateSchema } = renderForm({ defaultValue: '{"@extends":"ios/9.9.9"}' })

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent("Couldn't save configuration")
    expect(alert).toHaveTextContent('Unknown schema: ios/9.9.9')
    expect(updateSchema).not.toHaveBeenCalled()
  })

  it('surfaces API failures as save errors', async () => {
    const user = userEvent.setup()
    mockFetch(401, { error: 'Session expired' })
    const { updateSchema } = renderForm()

    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Session expired')
    expect(updateSchema).not.toHaveBeenCalled()
  })

  it('disables saving while the JSON is invalid', async () => {
    const fetchMock = mockFetch(200, { valid: true, errors: [] })
    const { textarea } = renderForm()

    fireEvent.change(textarea, { target: { value: '{"retries": }' } })

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('offers an example configuration on the first save of an empty schema', async () => {
    const user = userEvent.setup()
    const { textarea } = renderForm({ defaultValue: '', firstSave: true })

    expect(screen.getByRole('heading', { name: 'Start with a small example' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Use example' }))

    expect(JSON.parse(textarea.value)).toEqual({
      features: { welcomeMessage: true },
      limits: { itemsPerPage: 20 },
    })
    expect(screen.getByText('Example loaded into your draft. Review it and save when ready.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Use example' })).not.toBeInTheDocument()
  })

  it('does not offer the example once the schema has content', () => {
    renderForm({ firstSave: true })

    expect(screen.queryByRole('button', { name: 'Use example' })).not.toBeInTheDocument()
  })
})
