import { Effect } from 'effect'

import { getVersion } from '@/models/Version'
import {
  handleApiWithFailures,
  failWith,
  validateName,
  decodeParam,
  validateVersionName,
  requireSession,
} from '@/lib/apiHandler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function GET(
  request: Request,
  { params }: { params: Promise<{ platform: string; version: string }> }
) {
  return handleApiWithFailures(
    Effect.gen(function* () {
      yield* requireSession(request)
      const { platform, version } = yield* Effect.promise(() => params)
      const platformName = yield* decodeParam(platform, 'platform name')
      const versionName = yield* decodeParam(version, 'version name')
      yield* validateName(platformName, 'platform name')
      yield* validateVersionName(versionName)
      const data = yield* Effect.promise(() =>
        getVersion(platformName, versionName)
      )
      if (!data) {
        return yield* failWith('Version not found', 404)
      }
      return data
    })
  )
}
