import { NextResponse } from 'next/server'

import { getPlatforms } from '@/models/Platform'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  try {
    const platforms = await getPlatforms()
    return NextResponse.json(platforms, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('GET /api/schemas error:', error)
    return NextResponse.json(
      { error: process.env.NODE_ENV === 'development' ? message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
