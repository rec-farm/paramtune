import { Effect } from 'effect'

import { getPlatform, savePlatform } from '@/models/Platform'
import {
  handleApiWithFailures,
  failWith,
  validateName,
  requireSession,
  parseJsonBody,
} from '@/lib/apiHandler'
import { logAudit } from '@/lib/auditLog'
import { isValidVersionsList } from '@/lib/versionUtils'

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
      const session = yield* requireSession(request)
      const { platform } = yield* Effect.promise(() => params)
      const platformName = decodeURIComponent(platform)
      yield* validateName(platformName, 'platform name')
      const body = yield* parseJsonBody(request)

      if (!body || typeof body !== 'object') {
        return yield* failWith('Invalid JSON body', 400)
      }

      const versions = (body as Record<string, unknown>).versions ?? []
      if (!isValidVersionsList(versions)) {
        return yield* failWith(
          'Invalid "versions": must be an array of valid semantic version strings',
          400
        )
      }

      yield* Effect.promise(() =>
        savePlatform(platformName, { name: platformName, versions })
      )

      yield* Effect.promise(() =>
        logAudit({
          action: 'update',
          platform: platformName,
          userEmail: session.user?.email || 'unknown',
          userId: session.user?.id || 'unknown',
        })
      )

      return { ok: true }
    }),
    { status: 201 }
  )
}
