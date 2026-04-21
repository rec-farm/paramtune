# Paramtune

Paramtune is a Next.js application for managing platform schemas and versioned feature configuration with dependency resolution and Redis persistence.

## Overview

- **Next.js 16** (App Router), **React 19**, **TypeScript 5.9**
- **Tailwind CSS 4** for styling with shadcn/ui components
- **Redis** (via ioredis) for schema and platform persistence
- **SQLite** (via better-sqlite3) for authentication data
- **JSON schema composition** with `@extends` and semver-aware dependency resolution
- **Authentication** via better-auth (Google OAuth in production, email/password in development)
- **Real-time JSON editing** with live preview, validation, and schema diffing
- **Audit logging** for all schema and platform changes
- **Rate limiting** on API and auth routes
- **Dashboard UI** for managing platforms, versions, and schemas

## Requirements

- Node.js 20+ (LTS recommended)
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

3) Start development server

```bash
pnpm dev
```

In development, email/password login is enabled with credentials configured in `.env.local` (`DEV_USER_EMAIL` / `DEV_USER_PASSWORD`).

## Development Commands

- `pnpm dev` – start development server with hot reload
- `pnpm build` – production build
- `pnpm start` – run production server locally
- `pnpm lint` – lint with ESLint
- `pnpm typecheck` – TypeScript type checking
- `pnpm test` – run tests with Vitest
- `pnpm test:watch` – run tests in watch mode
- `pnpm test:coverage` – run tests with coverage report
- `pnpm analyze` – bundle analysis with webpack-bundle-analyzer

## Environment Variables

- `CORS_ORIGIN` – Allowed origin for cross-origin API requests
- `REDIS_URL` – Full Redis connection URL (preferred)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB` – Individual Redis settings when URL is not provided
- `BETTER_AUTH_SECRET` – Secret used by better-auth for signing. Generate with `openssl rand -base64 32`
- `BETTER_AUTH_URL` – Public base URL for auth callbacks, e.g. `https://paramtune.example.com`
- `BETTER_AUTH_BASE_URL` – Optional alias supported for deployments that use the Better Auth base URL name
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
- Security headers (CSP, HSTS, X-Frame-Options) via proxy
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
- CORS support via proxy
- JSON responses with structured error handling

## Deployment

### Vercel (Recommended)

1) Push to GitHub/GitLab repository
2) Import project in Vercel (Next.js framework)
3) Configure environment variables in Vercel dashboard
4) Deploy – automatic on pushes to main branch

### Docker

```bash
# Development
docker-compose -f docker-compose.dev.yml up --build

# Production
export REDIS_PASSWORD="$(openssl rand -base64 24)"
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
export BETTER_AUTH_URL="http://localhost:3000"
docker-compose up --build -d
```

## Architecture

- `src/app/` – App Router pages, API routes, and API docs
- `src/models/` – Server-side Redis access and business logic (Platform, Schema, Version)
- `src/components/` – React components (editors, navigation, diff viewer, UI primitives)
- `src/lib/` – Shared utilities (auth, audit logging, rate limiting, schema diffing, validation)
- `src/actions/` – Server actions for schema validation
- `src/connections/redis.ts` – Redis client configuration
- `src/proxy.ts` – Request proxy for CORS, security headers, auth gating, and rate limiting
- `tests/` – Vitest test suite
- `docs/` – Extended documentation (API, architecture, deployment, Docker, troubleshooting)

## Documentation

- [API Reference](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
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
pnpm build
pnpm audit --audit-level moderate
```

## Security

Please report vulnerabilities privately using the guidance in [SECURITY.md](SECURITY.md).

## License

Paramtune is released under the [MIT License](LICENSE).
