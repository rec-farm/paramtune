import { NextResponse, type NextRequest } from 'next/server'

import { getVersions } from '@/models/Version'

export const dynamic = 'force-dynamic'

type Context = {
  params: {
    platform: string
  }
}

export async function GET(_request: NextRequest, context: Context) {
  const versions = await getVersions(context.params.platform)


  return NextResponse.json(versions, {
    status: 200,
    headers: { cache: 'no-store' }
  })
}

export async function POST(request: NextRequest) {

  // request.body

  // await savePlatform(platform, await request.body.json())

}
