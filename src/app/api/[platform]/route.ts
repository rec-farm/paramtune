import { NextResponse, type NextRequest } from 'next/server'

import { getPlatform, savePlatform } from '@/models/Platform'

export const dynamic = 'force-dynamic'

type Context = {
  params: {
    platform: string
  }
}

export async function GET(_request: NextRequest, context: Context) {
  const { platform } = context.params

  return NextResponse.json(await getPlatform(platform), {
    status: 200,
    headers: {
      cache: 'no-store'
    }
  })
}

export async function POST(request: NextRequest) {

  // request.body

  // await savePlatform(platform, await request.body.json())
}
