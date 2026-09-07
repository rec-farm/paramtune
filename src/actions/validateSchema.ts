'use server'

import { headers } from 'next/headers'
import { requireDashboardSession } from '@/lib/dashboardAuth'
import { validateSchemaContent as validateSchemaContentInternal } from '@/models/Schema'

export type SchemaValidationResult = {
  valid: boolean
  errors: string[]
}

export async function validateSchemaContent(
  content: Record<string, unknown>
): Promise<SchemaValidationResult> {
  await requireDashboardSession(await headers())
  return validateSchemaContentInternal(content)
}
