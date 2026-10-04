# Next.js replacement and reusable checklist

Vite/React Router replaces App Router; Hono/Node replaces handlers, middleware, and Server Actions. Existing page URLs, configuration API contracts, Redis formats, and SQLite storage remain intact. Local fonts retain Archivo width, Figtree, and Geist Mono.

## Dashboard API

All endpoints under /api/_ui/v1 require sessions and return uncached JSON.

| Method | Path | Body or result |
| --- | --- | --- |
| GET | /overview | Platforms and aggregated revision status |
| POST | /platforms | { name }; duplicates return 409 |
| POST | /platforms/:platform/versions | { version } |
| GET | /platforms/:platform/versions/:version/schema | Content, output, history, SHA-256 |
| PUT | /platforms/:platform/versions/:version/schema | { content } for save/restore |
| POST | /validate | { content } |
| POST | /compare | { platformA, versionA, platformB, versionB } |

Authors come from the session. Existing /api/schemas, /api/:platform, /api/:platform/versions, and /api/:platform/:version remain available. The longer dashboard namespace avoids reserving a previously valid platform name.

## Verification

Run lint, typecheck, unit/HTTP contract tests, production build, and audit. Run the production browser suite against dedicated Redis: it uses disposable auth storage and checks HTML, redirects, cookies, creation, saving, history/restore, composition, comparison, mobile navigation, reload, sign-out, and page errors.

Build the Docker image and verify SQLite initialization and startup. Validate Google/Handstamp OAuth and the rec-farm HTTPS reverse proxy on the actual deployment; local development login does not prove a live provider callback.

## Reuse across projects

Inventory Next imports, handlers, actions, server data reads, middleware, caching, metadata, and deployment hooks. Classify each route as client-rendered, prerendered, or requiring SSR. React Router Framework Mode may fit projects requiring request-time HTML better than this SPA/API layout.

Preserve domain/storage logic first. Define JSON contracts and authenticate every HTTP boundary. Migrate one complete flow, keep one public origin, and replace implicit refresh with explicit revalidation. Test contracts before removing Next. Measure startup/build/browser behavior rather than assuming a speed improvement.

Extract a starter after a second project validates the conventions. This repository is a reference implementation, not a universal codemod: auth, SSR, caching, and persistence require project review.
