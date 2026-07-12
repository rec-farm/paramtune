import { Effect } from 'effect'

import { getPlatform, savePlatform } from '@/models/Platform'
import { getVersions } from '@/models/Version'
import {
  handleApiWithFailures,
  failWith,
  validateName,
  requireSession,
  parseJsonBody,
} from '@/lib/apiHandler'
import { logAudit } from '@/lib/auditLog'
import { isValidVersion } from '@/lib/versionUtils'

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
      const session = yield* requireSession(request)
      const { platform } = yield* Effect.promise(() => params)
      const platformName = decodeURIComponent(platform)
      yield* validateName(platformName, 'platform name')
      const body = yield* parseJsonBody(request)

      const version = body?.version as string | undefined
      if (!version) {
        return yield* failWith('Missing "version" in body', 400)
      }
      yield* validateName(version, 'version name')
      if (!isValidVersion(version)) {
        return yield* failWith(
          `Invalid version "${version}": must be a valid semantic version (e.g. 1.2.3)`,
          400
        )
      }

      const current = yield* Effect.promise(() => getPlatform(platformName))
      const nextVersions = Array.from(
        new Set([...(current?.versions || []), version])
      )
      yield* Effect.promise(() =>
        savePlatform(platformName, { name: platformName, versions: nextVersions })
      )

      yield* Effect.promise(() =>
        logAudit({
          action: 'create',
          platform: platformName,
          version,
          userEmail: session.user?.email || 'unknown',
          userId: session.user?.id || 'unknown',
        })
      )

      return { ok: true }
    }),
    { status: 201 }
  )
}
