import { NextRequest, NextResponse } from 'next/server'

type Context = {
  params: {
    slug: string[]
  }
}

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



export async function GET(_request: NextRequest, context: Context) {
  const [platform, version] = context.params.slug

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
