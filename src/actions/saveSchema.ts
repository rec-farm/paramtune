'use server'

import { headers } from 'next/headers'
import { requireDashboardSession } from '@/lib/dashboardAuth'
import { saveSchema as saveSchemaInternal, type Author } from '@/models/Schema'
import { logAudit } from '@/lib/auditLog'

export async function saveSchemaContent(
  platform: string,
  version: string,
  content: Record<string, unknown>
): Promise<void> {
  const session = await requireDashboardSession(await headers())

  const author: Author = {
    id: session.user.id,
    name: session.user.name || 'Unknown',
    image: session.user.image || undefined,
  }

  await saveSchemaInternal(platform, version, content, author)

  await logAudit({
    action: 'update',
    platform,
    version,
    userEmail: session.user?.email || 'unknown',
    userId: session.user?.id || 'unknown',
  })
}
