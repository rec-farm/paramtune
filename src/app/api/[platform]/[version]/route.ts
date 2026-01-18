import { NextResponse } from 'next/server'

import { getVersion, getVersions } from '@/models/Version'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ platform: string; version: string }> }
) {
  try {
    const resolvedParams = await params
    const { platform, version } = resolvedParams
    const platformName = decodeURIComponent(platform)
    const versionName = decodeURIComponent(version)

    if (version === 'versions') {
      const list = await getVersions(platformName)
      return NextResponse.json(list, {
        status: 200,
        headers: { 'Cache-Control': 'no-store' },
      })
    }

    const data = await getVersion(platformName, versionName)
    if (!data) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 })
    }
    return NextResponse.json(data, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('GET /api/[platform]/[version] error:', error)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
