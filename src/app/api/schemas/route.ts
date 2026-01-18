import { NextResponse } from 'next/server'

type SlugParams = { slug: string[] }

type Db = Record<string, Record<string, unknown>>

const db: Db = {
  mobile: {
    '1.1.0': {
      name: '1.1.0',
      something: 'something',
      myFeature: {
        enabled: true,
      }
    },
    '1.1.1': {
      version: '1.1.1',
      myFeature: {
        enabled: false,
      }
    }
  }
}



export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(_request: Request, { params }: any) {
  try {
    const [platform, version] = (params as SlugParams).slug

    if (!db[platform] || platform === 'platforms') {
      return NextResponse.json(
        [
          {
            id: 'mobile',
            name: 'mobile',
            versions: ['1.1.0', '1.1.1'],
          },
        ],
        { status: 200, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const record = db[platform][version]
    if (!record) {
      return NextResponse.json({ error: 'Schema not found' }, { status: 404 })
    }

    return NextResponse.json(record, {
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
