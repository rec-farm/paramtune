import { redirect } from 'react-router'
import type { SchemaValidationResult } from '@/shared/contracts'

export const UI_API = '/api/_ui/v1'
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message) }
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init, credentials: 'same-origin',
    headers: { ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
  })
  const data = await response.json()
  if (!response.ok) throw new ApiError(data.error || `Request failed (${response.status})`, response.status)
  return data as T
}
export async function load<T>(path: string, request: Request): Promise<T> {
  try { return await api<T>(path, { signal: request.signal }) }
  catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const url = new URL(request.url)
      throw redirect(`/login?returnTo=${encodeURIComponent(url.pathname + url.search)}`)
    }
    throw error
  }
}
export const schemaPath = (platform: string, version: string) =>
  `${UI_API}/platforms/${encodeURIComponent(platform)}/versions/${encodeURIComponent(version)}/schema`
export function validateSchemaContent(content: Record<string, unknown>) {
  return api<SchemaValidationResult>(`${UI_API}/validate`, { method: 'POST', body: JSON.stringify({ content }) })
}
