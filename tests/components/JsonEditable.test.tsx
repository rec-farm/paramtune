import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { JsonEditable } from '@/components/JsonEditable'

function renderEditor(defaultValue = '{"enabled":true}') {
  const onValidationChange = vi.fn()
  const view = render(
    <form aria-label="editor">
      <JsonEditable
        title=""
        name="content"
        defaultValue={defaultValue}
        onValidationChange={onValidationChange}
      />
    </form>
  )
  const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
  const hidden = view.container.querySelector('input[name="content"]') as HTMLInputElement
  return { onValidationChange, textarea, hidden }
}

function edit(textarea: HTMLTextAreaElement, value: string) {
  fireEvent.change(textarea, { target: { value } })
}

describe('JsonEditable', () => {
  it('pretty-prints the default value and reports it as valid', () => {
    const { textarea, hidden } = renderEditor()

    expect(textarea.value).toBe('{\n  "enabled": true\n}')
    expect(hidden.value).toBe(textarea.value)
    expect(screen.getByRole('status')).toHaveTextContent('Valid JSON')
    expect(screen.getByText(/3 lines/)).toBeInTheDocument()
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
  })

  it('falls back to an empty object for malformed default values', () => {
    const { textarea } = renderEditor('{not json')

    expect(textarea.value).toBe('{}')
  })

  it('flags invalid JSON after the debounce and explains the error', async () => {
    const { textarea, hidden, onValidationChange } = renderEditor()

    edit(textarea, '{\n  "enabled": tru\n}')

    // The draft is submitted with the form even before it validates
    expect(hidden.value).toBe('{\n  "enabled": tru\n}')
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()

    await waitFor(() => expect(onValidationChange).toHaveBeenLastCalledWith(false))
    expect(screen.getByRole('status')).toHaveTextContent('Invalid JSON')
    expect(screen.getByRole('alert')).toHaveTextContent('JSON syntax error')
    expect(screen.getByRole('button', { name: 'Format' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled()
  })

  it('returns to a valid state once the JSON is fixed', async () => {
    const { textarea, onValidationChange } = renderEditor()

    edit(textarea, '{"enabled": }')
    await waitFor(() => expect(onValidationChange).toHaveBeenLastCalledWith(false))

    edit(textarea, '{"enabled": false}')
    await waitFor(() => expect(onValidationChange).toHaveBeenLastCalledWith(true))

    expect(screen.getByRole('status')).toHaveTextContent('Valid JSON')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Format' })).toBeEnabled()
  })

  it('warns about duplicate keys while keeping the JSON valid', async () => {
    const { textarea, onValidationChange } = renderEditor()

    edit(textarea, '{"a": 1, "a": 2}')
    await waitFor(() => expect(onValidationChange).toHaveBeenLastCalledWith(true))

    expect(screen.getByRole('status')).toHaveTextContent('Valid JSON · 1 warning')
    expect(screen.getByText('Warning')).toBeInTheDocument()
  })

  it('formats the current text, including edits made during the debounce', async () => {
    const user = userEvent.setup()
    const { textarea, hidden } = renderEditor()

    edit(textarea, '{"enabled":false,"limit":5}')
    // Clicking Format before validation has run must not revert the edit
    await user.click(screen.getByRole('button', { name: 'Format' }))

    const formatted = '{\n  "enabled": false,\n  "limit": 5\n}'
    expect(textarea.value).toBe(formatted)
    expect(hidden.value).toBe(formatted)
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
  })

  it('copies the current text to the clipboard', async () => {
    const user = userEvent.setup()
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
    renderEditor()

    await user.click(screen.getByRole('button', { name: 'Copy' }))

    expect(writeText).toHaveBeenCalledWith('{\n  "enabled": true\n}')
  })
})
