import { NextResponse } from 'next/server'

import { getPlatform, savePlatform } from '@/models/Platform'
import { getVersions } from '@/models/Version'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const resolvedParams = await params
    const platformName = decodeURIComponent(resolvedParams.platform)
    const versions = await getVersions(platformName)
    return NextResponse.json(versions, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('GET /api/[platform]/versions error:', error)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const resolvedParams = await params
    const { platform } = resolvedParams
    const platformName = decodeURIComponent(platform)
    const body = await request.json().catch(() => null)
    const version = body?.version as string | undefined
    if (!version) {
      return NextResponse.json(
        { error: 'Missing "version" in body' },
        { status: 400 }
      )
    }

    const current = await getPlatform(platformName)
    const nextVersions = Array.from(
      new Set([...(current?.versions || []), version])
    )
    await savePlatform(platformName, {
      name: platformName,
      versions: nextVersions,
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('POST /api/[platform]/versions error:', error)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
