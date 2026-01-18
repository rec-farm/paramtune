import { NextResponse } from 'next/server'

import { getPlatform, savePlatform } from '@/models/Platform'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ platform: string }> }
) {
  try {
    const resolvedParams = await params
    const { platform } = resolvedParams
    const platformName = decodeURIComponent(platform)
    const data = await getPlatform(platformName)

    if (!data) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 })
    }

    return NextResponse.json(data, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('GET /api/[platform] error:', error)
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
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    await savePlatform(platformName, body as Record<string, unknown>)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('POST /api/[platform] error:', error)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
