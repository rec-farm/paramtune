'use client'

import { useCallback, useState, useTransition } from 'react'
import { JsonEditable } from '@/components/JsonEditable'
import Button from '@/components/ui/Button'
import { validateSchemaContent } from '@/actions/validateSchema'

type Props = {
  defaultValue: string
  updateSchema: (formData: FormData) => Promise<void>
}

export default function SchemaEditorForm({
  defaultValue,
  updateSchema,
}: Props) {
  const [isValid, setIsValid] = useState(true)
  const [dependencyErrors, setDependencyErrors] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [currentContent, setCurrentContent] = useState<string>('')

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
        handleSubmit(formData)
      })
    },
    [handleSubmit]
  )

  return (
    <form action={handleFormAction}>
      <JsonEditable
        title=""
        name="content"
        defaultValue={validDefaultValue}
        onValidationChange={handleValidationChange}
        renderToolbar={({ isValid: valid, onFormat, onCopy, onDownload }) => (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              disabled={!valid}
              onClick={onFormat}
            >
              Format
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8"
              disabled={!valid}
              onClick={onCopy}
            >
              Copy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="h-8"
              disabled={!isValid || isPending}
            >
              {isPending ? 'Validating...' : 'Save'}
            </Button>
          </div>
        )}
      />

      {/* Dependency validation errors */}
      {dependencyErrors.length > 0 && (
        <div className="mt-4 bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          <p className="text-sm text-red-400 font-medium">
            Dependency Error{dependencyErrors.length > 1 ? 's' : ''}
          </p>
          <p className="text-xs text-red-300 mt-1">
            The following @extends references could not be resolved:
          </p>
          <ul className="list-disc list-inside mt-2">
            {dependencyErrors.map((error, index) => (
              <li key={index} className="text-xs text-red-300">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  )
}
