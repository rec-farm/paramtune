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



export async function GET(
  _request: Request,
  { params }: any
) {
  const [platform, version] = (params as SlugParams).slug

  if (!db[platform] || platform === 'platforms') {
    return NextResponse.json([
      {
        id: 'mobile',
        name: 'mobile',
        versions: [
          '1.1.0',
          '1.1.1',
        ]
      }
    ])
  }

  return NextResponse.json(db[platform][version], { status: 200, headers: {
    cache: 'no-store'
  }})
}
