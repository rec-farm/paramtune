import { NextResponse } from 'next/server'

import { getVersions, getVersion } from '@/models/Version'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: any
) {
  const { platform, version } = params as { platform: string; version: string }

  if (version === 'versions') {
    return NextResponse.json(await getVersions(platform), {
      status: 200,
      headers: { cache: 'no-store' }
    })
  }

  return NextResponse.json(await getVersion(platform, version), {
    status: 200,
    headers: {
      cache: 'no-store'
    }
  })
}
