import { NextResponse } from 'next/server'

import { getVersions } from '@/models/Version'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: any
) {
  const versions = await getVersions((params as { platform: string }).platform)


  return NextResponse.json(versions, {
    status: 200,
    headers: { cache: 'no-store' }
  })
}

export async function POST(request: Request) {

  // request.body

  // await savePlatform(platform, await request.body.json())

}
