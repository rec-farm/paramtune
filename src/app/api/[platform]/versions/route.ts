import { NextResponse } from 'next/server'

import { getVersions } from '@/models/Version'
import { getPlatform, savePlatform } from '@/models/Platform'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: any) {
  try {
    const versions = await getVersions((params as { platform: string }).platform)
    return NextResponse.json(versions, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error: any) {
    console.error('GET /api/[platform]/versions error', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: any) {
  try {
    const { platform } = params as { platform: string }
    const body = await request.json().catch(() => null)
    const version = body?.version as string | undefined
    if (!version) {
      return NextResponse.json({ error: 'Missing "version" in body' }, { status: 400 })
    }

    const current = await getPlatform(platform)
    const nextVersions = Array.from(new Set([...(current?.versions || []), version]))
    await savePlatform(platform, { name: platform, versions: nextVersions })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/[platform]/versions error', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
