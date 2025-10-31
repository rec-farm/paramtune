'use client'

import { useCallback, useState } from 'react'
import { JsonEditable } from '@/components/JsonEditable'
import Button from '@/components/ui/Button'

type Props = {
  defaultValue: string
  updateSchema: (formData: FormData) => Promise<void>
}

export default function SchemaEditorForm({
  defaultValue,
  updateSchema,
}: Props) {
  const [isValid, setIsValid] = useState(true)

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
  }, [])

  return (
    <form action={updateSchema}>
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
              disabled={!isValid}
            >
              Save
            </Button>
          </div>
        )}
      />
    </form>
  )
}
