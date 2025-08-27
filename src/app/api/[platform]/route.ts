import { NextResponse } from 'next/server'

import { getPlatform, savePlatform } from '@/models/Platform'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: any) {
  try {
    const { platform } = params as { platform: string }
    const data = await getPlatform(platform)

    if (!data) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 })
    }

    return NextResponse.json(data, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error: any) {
    console.error('GET /api/[platform] error', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: any) {
  try {
    const { platform } = params as { platform: string }
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    await savePlatform(platform, body as Record<string, unknown>)
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error: any) {
    console.error('POST /api/[platform] error', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
