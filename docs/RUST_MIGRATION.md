# Rust backend migration

Axum/Tokio (`backend/`) is the default backend. Rust serves configuration APIs, production assets, Redis persistence, schema composition, semver resolution, history, diffs, audit logging, security middleware, and rate limiting. Vite and React Router retain the same frontend and API URLs.

Better Auth remains in a loopback-only Node/Hono sidecar. This migration still requires Node at runtime; a future Rust authentication replacement is separate work.

## Build and development

Install Rust 1.92+ (CI and Docker use 1.92), Node 22.12+, pnpm, and Redis.

```sh
pnpm dev:direct
pnpm backend:check
pnpm backend:test
pnpm build
pnpm start
```

Development compiles Rust before starting the API. Vite and the auth TypeScript watcher retain hot reload. Restart the dev command after Rust changes to rebuild; cargo-watch is not required. Inside Herdr, use herdr-run to start/restart development commands.

`pnpm build:web` builds the frontend, public-page prerendering, auth sidecar, and Node reference backend. `pnpm backend:build` compiles the Rust release binary. `pnpm build` runs both. Docker compiles Rust in a separate stage and copies the binary into the Node runtime image.

## Startup and authentication

The supervisor allocates an unused loopback auth port, waits for SQLite migrations and auth readiness, then starts Rust on PORT (default 3000). HOST controls Rust's listener; auth always binds 127.0.0.1. AUTH_PORT optionally fixes the sidecar port. PARAMTUNE_API_BINARY overrides the executable path. AUTH_SERVICE_URL is injected by the supervisor and accepts only HTTP loopback origins. All settings are server-only.

Supervised children stop together on signals or unexpected exits. `/healthz` checks Rust and auth readiness, not Redis readiness. Redis connects lazily.

Public `/api/auth/*` traffic is proxied without following redirects. Headers, repeated Set-Cookie values, and OAuth callback paths survive forwarding. Rust strips incoming identity/IP forwarding headers, then sends the verified peer IP (or trusted proxy IP when TRUST_PROXY=true) in a dedicated header. Better Auth trusts that header only in sidecar mode.

Every configuration request and protected dashboard HTML request asks the private `/_internal/session` endpoint to validate the cookie against SQLite through Better Auth, with cookie caching disabled. Rust does not expose this endpoint publicly. The internal check bypasses public auth rate-limit buckets. Missing sessions return 401; unavailable or malformed auth responses return 503 and grant no access.

Google/OIDC, PKCE, role mapping, account-linking policy, development login, and signed backchannel logout retain their existing implementation.

## Data and rollback

Redis keys and SQLite tables remain compatible. Preserve data volumes, AUTH_DB_PATH, BETTER_AUTH_SECRET, and BETTER_AUTH_URL. Rust writes existing sorted-set members and dependent sets, retains 200 history entries and 1,000 audit entries, and uses JavaScript-compatible number/key serialization for sorted-set member identity and content hashes. Dependency ranges use npm semver semantics.

The Node domain implementation remains as a reference and rollback path:

```sh
PARAMTUNE_BACKEND=node pnpm start
PARAMTUNE_BACKEND=node pnpm dev:direct
```

Both runtimes read and write the same storage. Roll back code/runtime while preserving post-cutover writes. The Docker image includes Node fallback; set PARAMTUNE_BACKEND=node on the app and restart. Keep the previous image as an independent rollback option.

Rate limiting remains per process. Recursive schema composition is limited to 128 levels. Dependent cascades remain best-effort after the source write, and dropped dependencies are removed from reverse indexes. The existing consistency model remains; this migration does not add cross-process write locking.

## Verification

Run lint, typecheck, TypeScript tests, Rust checks/tests, build, audit, and `pnpm test:e2e:ci`. Integration uses disposable SQLite and a dedicated E2E_REDIS_URL, with development/production servers and a Node reference on ports 4481/4482/4483. Never use production Redis for tests.

Browser coverage includes public HTML, protected links, cookies, creation, saves, restore, composition, comparison, reload, mobile navigation, and logout. Additional HTTP tests seed through Node and check Rust reads/mutations, deduplication, cascades, detached dependencies, validation, diffs, bad bodies, CSRF, and forged identity. Rust tests cover proxy cookies, auth outages, rate limits, npm ranges, JSON serialization, and diffs.

Local development login and mock HTTP tests do not verify live Google/Handstamp credentials or the deployed HTTPS proxy. Verify those on the actual deployment before switching traffic.
