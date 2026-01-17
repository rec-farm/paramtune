# External Integrations

**Analysis Date:** 2026-01-17

## APIs & External Services

**Payment Processing:**
- Not detected

**Email/SMS:**
- Not detected

**External APIs:**
- Not detected

## Data Storage

**Databases:**
- Redis 7-alpine - Primary data store
  - Connection: via `REDIS_URL` env var (preferred) or `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`/`REDIS_DB`
  - Client: ioredis 5.8.2 (`src/connections/redis.ts`)
  - Data structure: Sorted sets (ZSET) for versioned storage, Sets for dependency tracking
  - Keys: `platforms:{id}`, `schemas:{platform}:{version}`, `schemas:dependents:{platform}:{version}`

**File Storage:**
- Not detected - No cloud storage integration

**Caching:**
- Redis - Used for primary persistence (not separate caching layer)

## Authentication & Identity

**Auth Provider:**
- Not detected - No authentication system configured

**OAuth Integrations:**
- Not detected

## Monitoring & Observability

**Error Tracking:**
- Not detected - No Sentry, LogRocket, or similar

**Analytics:**
- Not detected - No analytics service

**Logs:**
- Console logging only (stdout/stderr)
- `console.log` and `console.error` used throughout

## CI/CD & Deployment

**Hosting:**
- Vercel - Recommended deployment target
  - Deployment: Automatic on main branch push
  - Environment vars: Configured in Vercel dashboard

- Docker - Self-hosted option
  - `Dockerfile` - Multi-stage build with Node.js 18-alpine
  - `docker-compose.yml` - Production with Redis service
  - `docker-compose.dev.yml` - Development environment

**CI Pipeline:**
- Not detected - No GitHub Actions or similar

## Environment Configuration

**Development:**
- Required env vars: `CORS_ORIGIN`, `REDIS_URL` (or individual Redis settings)
- Secrets location: `.env.local` (gitignored)
- Template: `.env.local.example`
- Redis: Local Docker container or cloud provider

**Staging:**
- Not explicitly configured (same as production with different env vars)

**Production:**
- Secrets management: Vercel environment variables or Docker environment
- Redis: Separate production instance required
- CORS: Set `CORS_ORIGIN` to exact production domain

## Webhooks & Callbacks

**Incoming:**
- Not detected

**Outgoing:**
- Not detected

## Middleware & Security

**CORS:**
- `src/middleware.ts` - Configurable CORS middleware
- Origin validation via `CORS_ORIGIN` environment variable
- Applied to `/api/*` routes

**Security Headers:**
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- X-Frame-Options: SAMEORIGIN
- HSTS: Enabled in production (63072000 seconds)

---

*Integration audit: 2026-01-17*
*Update when adding/removing external services*
