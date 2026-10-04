import { notFound } from 'next/navigation'

/**
 * Percent-decodes a dashboard route segment, rendering the 404 page on
 * malformed escapes (e.g. "%E0%A4%A"). A bare decodeURIComponent throws a
 * URIError there, which surfaces as a 500 for what is a client mistake.
 */
export function decodeRouteParam(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    notFound()
  }
}
