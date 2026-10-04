import { auth } from '@/lib/auth'

// The redirect URI apps register with Handstamp is
// /api/auth/oauth2/callback/<id>, the path older Better Auth versions served.
// Better Auth 1.7 handles generic OAuth callbacks at /api/auth/callback/<id>,
// so hand the request over unchanged apart from the path.
async function forward(request: Request, providerId: string) {
  const url = new URL(request.url)
  url.pathname = `/api/auth/callback/${encodeURIComponent(providerId)}`
  const init: RequestInit = { method: request.method, headers: request.headers }
  if (request.method === 'POST') init.body = await request.arrayBuffer()
  return auth.handler(new Request(url, init))
}

type Params = { params: Promise<{ providerId: string }> }

export async function GET(request: Request, { params }: Params) {
  return forward(request, (await params).providerId)
}

export async function POST(request: Request, { params }: Params) {
  return forward(request, (await params).providerId)
}
