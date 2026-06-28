import { Effect } from 'effect'

import { getPlatform, savePlatform } from '@/models/Platform'
import { handleApiWithFailures, failWith, validateName, requireSession } from '@/lib/apiHandler'
import { auth } from '@/lib/auth'
import { logAudit } from '@/lib/auditLog'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  return handleApiWithFailures(
    Effect.gen(function* () {
      yield* requireSession(request)
      const { platform } = yield* Effect.promise(() => params)
      const platformName = decodeURIComponent(platform)
      yield* validateName(platformName, 'platform name')
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
      yield* requireSession(request)
      const { platform } = yield* Effect.promise(() => params)
      const platformName = decodeURIComponent(platform)
      yield* validateName(platformName, 'platform name')
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

      const session = yield* Effect.promise(() =>
        auth.api.getSession({ headers: request.headers })
      )
      yield* Effect.promise(() =>
        logAudit({
          action: 'update',
          platform: platformName,
          userEmail: session?.user?.email || 'unknown',
          userId: session?.user?.id || 'unknown',
        })
      )

      return { ok: true }
    }),
    { status: 201 }
  )
}
