# Paramtune

Paramtune is a React application with a Vite frontend and Rust/Axum API with a Node/Better Auth sidecar for managing platform schemas and versioned feature configuration with dependency resolution and Redis persistence.

## Overview

- **Vite**, **React 19**, **React Router**, **TypeScript**
- **Axum/Tokio** on **Rust 1.92+**, with **Node.js 22.12+** for Better Auth
- **Tailwind CSS 4** for styling with shadcn/ui components
- **Redis** (via the Rust redis client) for schema and platform persistence
- **SQLite** (via better-sqlite3) for authentication data
- **JSON schema composition** with `@extends` and semver-aware dependency resolution
- **Authentication** via better-auth (Google or Handstamp/OIDC in production, email/password in development)
- **Real-time JSON editing** with live preview, validation, and schema diffing
- **Audit logging** for all schema and platform changes
- **Rate limiting** on API and auth routes
- **Dashboard UI** for managing platforms, versions, and schemas

## Requirements

- Rust 1.92+
- Node.js 22.12+ (LTS recommended)
- pnpm 10.x
- Redis accessible locally or through a cloud provider

## Quick Start

1) Copy environment example and configure

```bash
cp .env.local.example .env.local
```

2) Install dependencies

```bash
pnpm install
```

3) Start Redis

```bash
docker-compose -f docker-compose.dev.yml up redis
```

4) Start development server

The dev server runs through [portless](https://github.com/vercel-labs/portless), which serves the app at a stable `paramtune.localhost` URL instead of a port number. Install it globally once (do not add it as a project dependency):

```bash
npm install -g portless
pnpm dev
```

If you don't want portless, run `pnpm dev:direct` (or `PORTLESS=0 pnpm dev`) to start the frontend and API directly on `http://localhost:3000`, and set `BETTER_AUTH_URL` / `CORS_ORIGIN` in `.env.local` to match.

Rust is compiled at development startup; restart the dev command after Rust changes. Vite and auth TypeScript retain hot reload.

Authentication tables are created and upgraded automatically at startup. `pnpm auth:migrate` is available for explicit preflight migrations.

In development, email/password login is enabled with credentials configured in `.env.local` (`DEV_USER_EMAIL` / `DEV_USER_PASSWORD`).

## Development Commands

- `pnpm dev` – start development server with hot reload through `portless` (`paramtune.localhost`)
- `pnpm dev:direct` – start development server directly on `localhost:3000`, without `portless`
- `pnpm build` – frontend, auth service, and Rust release build
- `pnpm backend:check` – Rust formatting and Clippy
- `pnpm backend:test` – Rust unit/HTTP tests
- `pnpm start` – run production server locally
- `pnpm lint` – lint with ESLint
- `pnpm typecheck` – TypeScript type checking
- `pnpm test` – run tests with Vitest
- `pnpm test:watch` – run tests in watch mode
- `pnpm test:coverage` – run tests with coverage report
- `pnpm analyze` – build and list JavaScript/CSS asset sizes

## Environment Variables

- `CORS_ORIGIN` – Allowed origin for cross-origin API requests
- `REDIS_URL` – Full Redis connection URL (preferred)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB` – Individual Redis settings when URL is not provided
- `BETTER_AUTH_SECRET` – Secret used by better-auth for signing. Generate with `openssl rand -base64 32`
- `BETTER_AUTH_URL` – Public base URL for auth callbacks, e.g. `https://paramtune.example.com`
- `BETTER_AUTH_BASE_URL` – Optional alias supported for deployments that use the Better Auth base URL name
- `AUTH_DB_PATH` – SQLite database path for auth data. Defaults to `./data/auth.db`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` – Google OAuth credentials (production)
- `DEV_USER_EMAIL`, `DEV_USER_PASSWORD`, `DEV_USER_NAME` – Development login credentials

## Features

### Schema Management
- Create and manage platform schemas with JSON editor
- Support for `@extends` directive for schema composition
- Semver-aware dependency resolution
- Real-time preview of resolved schemas
- Circular dependency detection
- Schema version diffing and history tracking

### Authentication & Security
- Google OAuth sign-in (production) with email/password fallback (development)
- Session-based authentication via better-auth with SQLite storage
- All API endpoints require authentication
- Rate limiting on API and auth routes
- Security headers (CSP, HSTS, X-Frame-Options) via HTTP middleware
- CORS configuration with same-origin default in production

### Dashboard
- Platform overview with version management
- Interactive JSON editor with syntax highlighting
- Live schema validation and preview
- Schema diff viewer for comparing versions
- Audit log of platform and schema changes
- Responsive sidebar navigation

### API
- RESTful endpoints for platform and schema management
- Interactive API documentation at `/api-docs`
- CORS support via HTTP middleware
- JSON responses with structured error handling

## Deployment

### Docker (Recommended for self-hosting)

```bash
# Development
docker-compose -f docker-compose.dev.yml up --build

# Production
export REDIS_PASSWORD="$(openssl rand -base64 24)"
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
export BETTER_AUTH_URL="http://localhost:3000"
docker-compose up --build -d
```

### rec-farm

Deploy the Rust/Node Docker application on rec-farm with persistent Redis and SQLite
storage. The Rust process serves the frontend and API behind the HTTPS reverse
proxy. See [Deployment](docs/DEPLOYMENT.md) for configuration and rollback.

## Architecture

- src/client: React Router pages, API client, styles, prerendering
- backend: Rust HTTP routes, security, Redis persistence, schema resolution, and asset serving
- src/server: Better Auth sidecar and Node reference backend for rollback
- src/shared: browser-safe JSON contracts
- src/models: retained Node domain implementation for compatibility tests and rollback
- src/components: reusable UI
- tests: unit/HTTP contracts and browser integration

Production serves frontend and API on one port. Development uses PORT (default
3000, or assigned by portless) and an automatically allocated local API port
with a same-origin proxy. A loopback auth port is also allocated automatically. Set API_PORT only when a fixed, free port is needed. The existing portless workflow remains available. Use herdr-run for
long-running processes inside Herdr.

Public pages are prerendered without database access. Dashboard reads and writes
use authenticated APIs. Browser builds reject server-only imports.

## Documentation

- [API Reference](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Rust migration and rollback](docs/RUST_MIGRATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Docker Setup](docs/DOCKER.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, coding conventions, and pull request expectations.

Before opening a pull request, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm backend:check
pnpm backend:test
pnpm build
pnpm audit --audit-level moderate
```

## Security

Please report vulnerabilities privately using the guidance in [SECURITY.md](SECURITY.md).

## License

Paramtune is released under the [MIT License](LICENSE).

## Browser integration

After building, install a browser with `pnpm exec playwright install chromium`.
Run `E2E_REDIS_URL=redis://127.0.0.1:6379/15 pnpm test:e2e:ci` against dedicated
Redis. The bounded suite owns ports 4481/4482/4483 and disposable SQLite storage.
Use E2E_CHROME=1 for installed Chrome. See [Migration and reuse](docs/VITE_MIGRATION.md).
