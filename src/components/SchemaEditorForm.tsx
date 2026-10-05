import { useCallback, useState, useTransition } from 'react'
import { JsonEditable } from '@/components/JsonEditable'
import { AlertCircle, Loader2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import { validateSchemaContent } from '@/client/api'

type Props = {
  firstSave?: boolean
  defaultValue: string
  updateSchema: (formData: FormData) => Promise<void>
}

export default function SchemaEditorForm({
  defaultValue,
  updateSchema,
  firstSave = false,
}: Props) {
  const [isValid, setIsValid] = useState(true)
  const [dependencyErrors, setDependencyErrors] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [exampleLoaded, setExampleLoaded] = useState(false)

  // Validate and format the JSON before passing to editor
  const getValidJson = useCallback((jsonString: string) => {
    if (!jsonString || jsonString.trim() === '') {
      return '{}'
    }

    try {
      // Try to parse the JSON
      const parsed = JSON.parse(jsonString)
      // Re-stringify to ensure proper formatting
      return JSON.stringify(parsed, null, 2)
    } catch (error) {
      // Return a valid empty object if JSON is malformed
      return '{}'
    }
  }, [])

  const validDefaultValue = getValidJson(defaultValue)

  const handleValidationChange = useCallback((valid: boolean) => {
    setIsValid(valid)
    // Clear dependency errors when JSON becomes invalid
    if (!valid) {
      setDependencyErrors([])
    }
  }, [])

  // Handle form submission with pre-save validation
  const handleSubmit = useCallback(
    async (formData: FormData) => {
      // Clear previous errors
      setDependencyErrors([])

      // Get the content from the form
      const contentStr = formData.get('content') as string
      if (!contentStr) return

      try {
        const content = JSON.parse(contentStr)

        // Validate dependencies before saving
        const validationResult = await validateSchemaContent(content)

        if (!validationResult.valid) {
          setDependencyErrors(validationResult.errors)
          return
        }

        // Dependencies valid, proceed with save
        await updateSchema(formData)
      } catch (error) {
        // JSON parse error - shouldn't happen as we validate isValid
        setDependencyErrors([
          error instanceof Error ? error.message : 'Invalid JSON',
        ])
      }
    },
    [updateSchema]
  )

  // Wrap submit in transition for loading state
  const handleFormAction = useCallback(
    (formData: FormData) => {
      startTransition(() => {
        return handleSubmit(formData)
      })
    },
    [handleSubmit]
  )

  return (
    <form action={handleFormAction} className="space-y-4">
      {firstSave && <div className="rounded-sm border border-border bg-surface-2 p-4 space-y-2">
        <h2 className="font-semibold">Start with a small example</h2>
        <p className="text-sm text-muted-foreground">Try a welcome-message feature flag and an items-per-page limit. These are illustrative settings; your application must read and use them. Load the example, edit its values, then save explicitly.</p>
        {exampleLoaded && <p role="status" className="text-sm text-muted-foreground">Example loaded into your draft. Review it and save when ready.</p>}
      </div>}

      <fieldset disabled={isPending} className="contents">
      <JsonEditable
        title=""
        name="content"
        defaultValue={validDefaultValue}
        onValidationChange={handleValidationChange}
        renderToolbar={({ isValid: valid, onFormat, onCopy, jsonText, setJsonText }) => (
          <div className="flex flex-wrap items-center gap-2">
            {firstSave && /^\{\s*\}$/.test(jsonText.trim()) && (
              <Button type="button" variant="secondary" size="sm" onClick={() => {
                setJsonText(JSON.stringify({ features: { welcomeMessage: true }, limits: { itemsPerPage: 20 } }, null, 2))
                setExampleLoaded(true)
              }}>Use example</Button>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!valid}
              onClick={onFormat}
            >
              Format
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!valid}
              onClick={onCopy}
            >
              Copy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!isValid || isPending}
              aria-busy={isPending}
            >
              {isPending && (
                <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} aria-hidden="true" />
              )}
              {isPending ? 'Saving' : 'Save changes'}
            </Button>
          </div>
        )}
      />

      {/* Dependency validation errors */}
      {dependencyErrors.length > 0 && (
        <div
          role="alert"
          className="mt-4 rounded-sm border border-border border-l-4 border-l-danger-icon bg-surface-2 px-5 py-4"
        >
          <p className="flex items-center gap-2 text-base font-semibold text-foreground">
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
            Couldn't save configuration
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Check the errors below, adjust your configuration if needed, then retry.
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {dependencyErrors.map((error, index) => (
              <li key={index} className="text-xs font-mono text-danger">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
      </fieldset>
    </form>
  )
}
