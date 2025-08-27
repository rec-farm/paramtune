import { NextResponse } from 'next/server'

import { getPlatform, savePlatform } from '@/models/Platform'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: any
) {
  const { platform } = params as { platform: string }

  return NextResponse.json(await getPlatform(platform), {
    status: 200,
    headers: {
      cache: 'no-store'
    }
  })
}

export async function POST(request: Request) {

  // request.body

  // await savePlatform(platform, await request.body.json())
}
