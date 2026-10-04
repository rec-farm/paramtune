import { Effect } from 'effect'

import { getPlatform, savePlatform } from '@/models/Platform'
import {
  handleApiWithFailures,
  failWith,
  validateName,
  decodeParam,
  requireSession,
  parseJsonBody,
} from '@/lib/apiHandler'
import { logAudit } from '@/lib/auditLog'
import { addVersion, isValidVersion } from '@/lib/versionUtils'


export function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  return handleApiWithFailures(
    Effect.gen(function* () {
      yield* requireSession(request)
      const { platform } = yield* Effect.promise(() => params)
      const platformName = yield* decodeParam(platform, 'platform name')
      yield* validateName(platformName, 'platform name')
      const data = yield* Effect.promise(() => getPlatform(platformName))

      if (!data) {
        return yield* failWith('Platform not found', 404)
      }

      return data.versions
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
      const platformName = yield* decodeParam(platform, 'platform name')
      yield* validateName(platformName, 'platform name')
      const body = yield* parseJsonBody(request)

      const version: unknown = body?.version
      if (!version) {
        return yield* failWith('Missing "version" in body', 400)
      }
      if (!isValidVersion(version)) {
        return yield* failWith(
          `Invalid version "${version}": must be a valid semantic version (e.g. 1.2.3)`,
          400
        )
      }

      const current = yield* Effect.promise(() => getPlatform(platformName))
      if (!current) {
        return yield* failWith('Platform not found', 404)
      }
      const nextVersions = addVersion(current.versions, version)
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
