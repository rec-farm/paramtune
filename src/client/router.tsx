import { createBrowserRouter, Outlet, ScrollRestoration, useNavigation, useRouteError, isRouteErrorResponse, Link } from 'react-router'
import type { LoaderFunctionArgs } from 'react-router'
import { load, UI_API, schemaPath, ApiError } from '@/client/api'
import type { Platform, Overview, SchemaDetail } from '@/shared/contracts'

export type DashboardData = { platforms: Platform[]; redisAvailable: boolean }
function Root() {
  const navigation = useNavigation()
  return <>
    {navigation.state !== 'idle' && <div className="fixed top-0 inset-x-0 z-50 h-1 bg-primary animate-pulse" role="progressbar" aria-label="Loading page" />}
    <Outlet /><ScrollRestoration />
  </>
}
function RouteError() {
  const error = useRouteError()
  const status = error instanceof ApiError ? error.status : isRouteErrorResponse(error) ? error.status : 500
  return <div className="min-h-64 flex items-center justify-center p-8">
    <div className="pt-card max-w-xl p-8 space-y-4" role="alert">
      <h1 className="pt-title-2">{status === 401 ? 'Your session has expired' : status === 404 ? 'We couldn’t find that page' : 'We couldn’t load this page'}</h1>
      <p className="text-muted-foreground">{status === 401 ? 'Sign in again to continue.' : status === 404 ? 'Check the address or return to the dashboard.' : 'Check your connection and the Redis service, then retry.'}</p>
      <div className="flex gap-3">
        <button className="pt-btn pt-btn-secondary" onClick={() => window.location.reload()}>Retry</button>
        <Link className="pt-btn pt-btn-primary" to={status === 401 ? '/login' : '/dashboard'}>{status === 401 ? 'Sign in' : 'Dashboard'}</Link>
      </div>
    </div>
  </div>
}
async function dashboardLoader({ request }: LoaderFunctionArgs): Promise<DashboardData> {
  try { return { platforms: await load<Platform[]>('/api/schemas', request), redisAvailable: true } }
  catch (error) {
    if (error instanceof Response || request.signal.aborted) throw error
    return { platforms: [], redisAvailable: false }
  }
}
export function createRouter() {
  return createBrowserRouter([{
    Component: Root, ErrorBoundary: RouteError,
    children: [
      { index: true, lazy: async () => ({ Component: (await import('@/client/pages/Home')).default }) },
      { path: 'login', loader: ({ request }) => load('/api/auth/providers', request), lazy: async () => ({ Component: (await import('@/client/pages/Login')).default }) },
      { path: 'api-docs', lazy: async () => ({ Component: (await import('@/client/pages/ApiDocs')).default }) },
      {
        path: 'dashboard', loader: dashboardLoader,
        lazy: async () => ({ Component: (await import('@/client/pages/Dashboard')).default }),
        children: [
          { index: true, ErrorBoundary: RouteError, loader: ({ request }) => load<Overview>(`${UI_API}/overview`, request), lazy: async () => ({ Component: (await import('@/client/pages/Overview')).default }) },
          { path: 'compare', ErrorBoundary: RouteError, loader: ({ request }) => load<Platform[]>('/api/schemas', request), lazy: async () => ({ Component: (await import('@/client/pages/Compare')).default }) },
          { path: ':platform', ErrorBoundary: RouteError, loader: ({ request, params }) => load<Platform>(`/api/${encodeURIComponent(params.platform!)}`, request), lazy: async () => ({ Component: (await import('@/client/pages/Platform')).default }) },
          { path: ':platform/:version', ErrorBoundary: RouteError, loader: ({ request, params }) => load<SchemaDetail>(schemaPath(params.platform!, params.version!), request), lazy: async () => ({ Component: (await import('@/client/pages/Schema')).default }) },
        ],
      },
      { path: '*', lazy: async () => ({ Component: (await import('@/client/pages/NotFound')).default }) },
    ],
  }])
}
