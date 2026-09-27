'use server'

import { headers } from 'next/headers'
import { requireDashboardSession } from '@/lib/dashboardAuth'
import { getPlatform, savePlatform, MissingPlatformError } from '@/models/Platform'
import { addVersion, isValidVersion } from '@/lib/versionUtils'
import { logAudit } from '@/lib/auditLog'
import { isValidName } from '@/lib/nameValidation'

export async function createPlatformVersion(
  platform: string,
  versionName: string
): Promise<void> {
  const session = await requireDashboardSession(await headers())

  if (typeof platform !== 'string' || !isValidName(platform)) {
    throw new Error(`Invalid platform name "${platform}"`)
  }

  const currentPlatform = await getPlatform(platform)
  if (!currentPlatform) {
    throw new MissingPlatformError({ platform })
  }

  if (typeof versionName !== 'string' || !isValidVersion(versionName)) {
    throw new Error(
      `Invalid version "${versionName}": must be a valid semantic version (e.g. 1.2.3)`
    )
  }

  await savePlatform(currentPlatform.name, {
    name: currentPlatform.name,
    versions: addVersion(currentPlatform.versions, versionName),
  })

  await logAudit({
    action: 'create',
    platform: currentPlatform.name,
    version: versionName,
    userEmail: session.user?.email || 'unknown',
    userId: session.user?.id || 'unknown',
  })
}
