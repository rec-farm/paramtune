import { Effect } from 'effect'

import { getPlatform, savePlatform } from '@/models/Platform'
import { getVersions } from '@/models/Version'
import { handleApi, handleApiWithFailures, failWith } from '@/lib/apiHandler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function GET(
  _request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  return handleApi(
    Effect.gen(function* () {
      const { platform } = yield* Effect.promise(() => params)
      const platformName = decodeURIComponent(platform)
      return yield* Effect.promise(() => getVersions(platformName))
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

      const version = body?.version as string | undefined
      if (!version) {
        return yield* failWith('Missing "version" in body', 400)
      }

      const current = yield* Effect.promise(() => getPlatform(platformName))
      const nextVersions = Array.from(
        new Set([...(current?.versions || []), version])
      )
      yield* Effect.promise(() =>
        savePlatform(platformName, { name: platformName, versions: nextVersions })
      )

      return { ok: true }
    }),
    { status: 201 }
  )
}
