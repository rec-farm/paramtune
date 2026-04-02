import { Effect } from 'effect'

import { getPlatforms } from '@/models/Platform'
import { handleApiWithFailures, requireSession } from '@/lib/apiHandler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function GET(request: Request) {
  return handleApiWithFailures(
    Effect.gen(function* () {
      yield* requireSession(request)
      return yield* Effect.promise(() => getPlatforms())
    })
  )
}
