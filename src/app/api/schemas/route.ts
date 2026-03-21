import { Effect } from 'effect'

import { getPlatforms } from '@/models/Platform'
import { handleApi } from '@/lib/apiHandler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function GET() {
  return handleApi(Effect.promise(() => getPlatforms()))
}
