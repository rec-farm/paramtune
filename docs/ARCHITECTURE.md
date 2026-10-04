# Architecture

Vite builds the React frontend. React Router owns page routes, loaders, error boundaries, and revalidation after writes. Hono on Node serves authenticated APIs and the production frontend at one origin.

- src/client: browser entry, routes, API client, styles, and public-page prerendering.
- src/server: HTTP routing, middleware, auth configuration, and authenticated services.
- src/shared/contracts.ts: browser-safe JSON types.
- src/models: existing Redis persistence, schema composition, semver resolution, cascade recomputation, and history.
- src/components: reusable React UI.

The homepage and API docs are prerendered without initializing auth or Redis. Dashboard routes and editor views are code-split. Lint and the Vite build reject server-only imports from browser code.

Better Auth retains its SQLite database, signing secret, cookie names, Google and OIDC callback paths, role mapping, and signed back-channel logout. The login page loads provider labels from a public runtime endpoint without exposing credentials. Native Request/Response handling forwards Set-Cookie directly. Development login is disabled in production.

Every configuration API read and write validates its session. Production dashboard HTML also checks the session. Browser redirects are a UX feature, not authorization. Mutations validate JSON and origin, reject cross-site requests, and limit bodies to 1 MiB. OAuth callbacks and signed provider logout use their protocol-specific authentication instead of the browser origin check. API error responses retain CORS, no-store, security headers, and Retry-After.

Rate limiting remains in-process. Enable TRUST_PROXY only behind a proxy that overwrites client-IP headers. Multiple replicas need shared rate limits and auth storage.

Redis keys and serialization are unchanged. History restores save with the current session author and retain the existing sorted-set deduplication of identical content. SQLite requires persistent writable storage. Authentication tables are migrated before the server starts accepting requests; an explicit migration command is also available.
