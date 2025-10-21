Paramtune is a Next.js app for managing platform schemas and versioned feature configuration with dependency resolution and Redis persistence.

## Overview

- Next.js 15 (App Router), React 19, TypeScript 5.9
- Tailwind CSS 4 for styling
- Redis (via ioredis) for persistence
- JSON schema composition with "@extends" and semver-aware dependency resolution

## Requirements

- Node.js 20–22 (LTS recommended)
- pnpm 9.x
- Redis accessible locally or through a cloud provider

## Setup

1) Copy env example and adjust values

```bash
cp .env.local.example .env.local
```

2) Install dependencies

```bash
pnpm install
```

3) Run the dev server

```bash
pnpm dev
```

Open http://localhost:3000

## Scripts

- `pnpm dev` – start dev server
- `pnpm build` – production build
- `pnpm start` – run production server locally
- `pnpm lint` – lint with ESLint
- `pnpm typecheck` – TypeScript type check

## Environment Variables

- `CORS_ORIGIN` – Allowed origin (e.g., http://localhost:3000)
- `REDIS_URL` – Full connection URL (preferred)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB` – Individual Redis settings when URL is not provided

## Deployment (Vercel)

1) Push to a GitHub/GitLab repo
2) Import the project in Vercel, framework: Next.js
3) Build command: `next build` (default)
4) Output dir: `.next` (default)
5) Set environment variables in Vercel Project Settings → Environment Variables
6) Optionally set `CORS_ORIGIN` to your production domain

`vercel.json` adds basic security headers and routing. Middleware handles CORS.

## API

- `GET /api/[platform]` → latest platform metadata or 404
- `POST /api/[platform]` → create/update platform metadata `{ name, versions }`
- `GET /api/[platform]/versions` → list of versions
- `POST /api/[platform]/versions` → append a version `{ version }`
- `GET /api/[platform]/[version]` → latest schema for version or 404

## Architecture

- `src/models/*` – server-side Redis access and business logic
- `src/app/*` – App Router pages and API routes
- Dependency resolution: `Schema.saveSchema` scans `@extends` references, resolves semver ranges against platform versions, produces a merged output, and cascades updates to dependents.

## Troubleshooting

- Redis connection fails: verify `REDIS_URL` or host/port and firewall
- 404s on APIs: ensure platform and versions exist (create via dashboard or POST APIs)
- CORS errors: set `CORS_ORIGIN` to the correct origin (including protocol)
- Type errors: run `pnpm typecheck`
