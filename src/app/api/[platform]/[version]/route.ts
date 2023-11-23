import { NextResponse, type NextRequest } from 'next/server'

import { getVersions, getVersion } from '@/models/Version'

export const dynamic = 'force-dynamic'

type Context = {
  params: {
    platform: string
    version: string
  }
}

export async function GET(_request: NextRequest, context: Context) {
  const { platform, version} = context.params

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
