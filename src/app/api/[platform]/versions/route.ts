import { Effect } from 'effect'

import { getPlatform, savePlatform } from '@/models/Platform'
import { getVersions } from '@/models/Version'
import { handleApiWithFailures, failWith, validateName } from '@/lib/apiHandler'
import { auth } from '@/lib/auth'
import { logAudit } from '@/lib/auditLog'

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
      yield* validateName(platformName, 'platform name')
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
      yield* validateName(platformName, 'platform name')
      const body = yield* Effect.tryPromise({
        try: () => request.json(),
        catch: () => 'parse-error' as const,
      }).pipe(Effect.catchAll(() => Effect.succeed(null)))

      const version = body?.version as string | undefined
      if (!version) {
        return yield* failWith('Missing "version" in body', 400)
      }
      yield* validateName(version, 'version name')

      const current = yield* Effect.promise(() => getPlatform(platformName))
      const nextVersions = Array.from(
        new Set([...(current?.versions || []), version])
      )
      yield* Effect.promise(() =>
        savePlatform(platformName, { name: platformName, versions: nextVersions })
      )

      const session = yield* Effect.promise(() =>
        auth.api.getSession({ headers: request.headers })
      )
      yield* Effect.promise(() =>
        logAudit({
          action: 'create',
          platform: platformName,
          version,
          userEmail: session?.user?.email || 'unknown',
          userId: session?.user?.id || 'unknown',
        })
      )

      return { ok: true }
    }),
    { status: 201 }
  )
}
