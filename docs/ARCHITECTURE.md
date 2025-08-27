# Architecture

- Next.js App Router in `src/app` for pages and API routes.
- Data layer in `src/models` interacts with Redis via `ioredis`.
- Schemas support `@extends` to compose configurations across platforms/versions.
- Semver resolution chooses the appropriate version: exact, range, or latest.
- On save, dependencies are recorded and dependents are cascaded for recomputation.

## Key Modules
- `models/Platform.ts` – platform metadata and versions
- `models/Version.ts` – version retrieval helpers
- `models/Schema.ts` – schema storage, dependency scanning, deep merge, cascade
- `connections/redis.ts` – environment-based Redis client
- `middleware.ts` – CORS and minimal security headers for `/api/*`