Paramtune is a Next.js application for managing platform schemas and versioned feature configuration with dependency resolution and Redis persistence.

## Overview

- **Next.js 15** (App Router), **React 19**, **TypeScript 5.9**
- **Tailwind CSS 4** for styling with shadcn/ui components
- **Redis** (via ioredis) for persistence and caching
- **JSON schema composition** with `@extends` and semver-aware dependency resolution
- **Real-time JSON editing** with live preview and validation
- **Dashboard UI** for managing platforms, versions, and schemas

## Requirements

- Node.js 20–22 (LTS recommended)
- pnpm 9.x
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

Open http://localhost:3000

## Development Commands

- `pnpm dev` – start development server with hot reload
- `pnpm build` – production build
- `pnpm start` – run production server locally
- `pnpm lint` – lint with ESLint
- `pnpm typecheck` – TypeScript type checking
- `pnpm analyze` – bundle analysis with webpack-bundle-analyzer

## Environment Variables

- `CORS_ORIGIN` – Allowed origin (e.g., http://localhost:3000)
- `REDIS_URL` – Full Redis connection URL (preferred)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB` – Individual Redis settings when URL is not provided

## Features

### Schema Management
- Create and manage platform schemas with JSON editor
- Support for `@extends` directive for schema composition
- Semver-aware dependency resolution
- Real-time preview of resolved schemas
- Circular dependency detection

### Dashboard
- Platform overview with version management
- Interactive JSON editor with syntax highlighting
- Live schema validation and preview
- Navigation between platforms and versions

### API Endpoints
- RESTful API for platform and schema management
- CORS support via middleware
- JSON responses with proper error handling

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
docker-compose up --build -d
```

## Architecture

- `src/models/` – Server-side Redis access and business logic
- `src/app/` – App Router pages and API routes
- `src/components/` – Reusable React components
- `connections/redis.ts` – Redis client configuration
- `middleware.ts` – CORS and security headers

### Key Components
- **Platform Model** – Platform metadata and version management
- **Schema Model** – Schema storage, dependency resolution, and cascade updates
- **JSON Editor** – Interactive schema editing with live preview
- **Navigation** – Platform and version navigation components

## API Documentation

See [docs/API.md](docs/API.md) for detailed API endpoint documentation.

## Troubleshooting

- **Redis connection**: Verify `REDIS_URL` or host/port configuration
- **404 errors**: Ensure platforms and versions exist (create via dashboard)
- **CORS issues**: Set `CORS_ORIGIN` to exact origin including protocol
- **Type errors**: Run `pnpm typecheck` for detailed diagnostics

## Contributing

1. Follow existing code style and conventions
2. Run `pnpm lint` and `pnpm typecheck` before committing
3. Use `@/*` path aliases for imports from `src/`
4. Mark client components with `'use client'` directive
