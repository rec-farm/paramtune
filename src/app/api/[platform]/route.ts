import { Effect } from 'effect'

import { getPlatform, savePlatform } from '@/models/Platform'
import { handleApiWithFailures, failWith } from '@/lib/apiHandler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function GET(
  _request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  return handleApiWithFailures(
    Effect.gen(function* () {
      const { platform } = yield* Effect.promise(() => params)
      const platformName = decodeURIComponent(platform)
      const data = yield* Effect.promise(() => getPlatform(platformName))

      if (!data) {
        return yield* failWith('Platform not found', 404)
      }

      return data
    })
  )
}

export function POST(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  return handleApiWithFailures(
    Effect.gen(function* () {
      const { platform } = yield* Effect.promise(() => params)
      const platformName = decodeURIComponent(platform)
      const body = yield* Effect.tryPromise({
        try: () => request.json(),
        catch: () => 'parse-error' as const,
      }).pipe(Effect.catchAll(() => Effect.succeed(null)))

      if (!body || typeof body !== 'object') {
        return yield* failWith('Invalid JSON body', 400)
      }

      yield* Effect.promise(() =>
        savePlatform(platformName, body as Record<string, unknown>)
      )
      return { ok: true }
    }),
    { status: 201 }
  )
}
