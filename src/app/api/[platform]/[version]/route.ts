import { NextResponse } from 'next/server'

import { getVersions, getVersion } from '@/models/Version'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: any) {
  try {
    const { platform, version } = params as { platform: string; version: string }

    if (version === 'versions') {
      const list = await getVersions(platform)
      return NextResponse.json(list, { status: 200, headers: { 'Cache-Control': 'no-store' } })
    }

    const data = await getVersion(platform, version)
    if (!data) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }
    return NextResponse.json(data, { status: 200, headers: { 'Cache-Control': 'no-store' } })
  } catch (error: any) {
    console.error('GET /api/[platform]/[version] error', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
