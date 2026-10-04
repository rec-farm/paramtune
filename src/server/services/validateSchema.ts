import { requireDashboardSession } from '@/lib/dashboardAuth'
import { validateSchemaContent as validateSchemaContentInternal } from '@/models/Schema'

export type SchemaValidationResult = {
  valid: boolean
  errors: string[]
}

export async function validateSchemaContent(
  requestHeaders: Headers,
  content: Record<string, unknown>
): Promise<SchemaValidationResult> {
  await requireDashboardSession(requestHeaders)
  return validateSchemaContentInternal(content)
}
