import { Effect } from 'effect'

import { getVersion, getVersions } from '@/models/Version'
import { handleApiWithFailures, failWith } from '@/lib/apiHandler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function GET(
  _request: Request,
  { params }: { params: Promise<{ platform: string; version: string }> }
) {
  return handleApiWithFailures(
    Effect.gen(function* () {
      const { platform, version } = yield* Effect.promise(() => params)
      const platformName = decodeURIComponent(platform)
      const versionName = decodeURIComponent(version)

      if (version === 'versions') {
        return yield* Effect.promise(() => getVersions(platformName))
      }

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
