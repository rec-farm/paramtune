# Technology Stack

**Analysis Date:** 2026-01-17

## Languages

**Primary:**
- TypeScript 5.9.3 - All application code (`package.json`, `tsconfig.json`)

**Secondary:**
- JavaScript - Configuration files (`next.config.js`, `eslint.config.mjs`)
- CSS/PostCSS - Styling (`postcss.config.mjs`, `src/app/globals.css`)

## Runtime

**Environment:**
- Node.js 20-22 (LTS recommended)
- Next.js 16.0.6 server runtime

**Package Manager:**
- pnpm 10.19.0 (`package.json` packageManager field)
- Lockfile: `pnpm-lock.yaml` present

## Frameworks

**Core:**
- Next.js 16.0.6 - Full-stack framework with App Router (`next.config.js`)
- React 19.2.0 - UI library (`package.json`)
- React DOM 19.2.0 - DOM rendering

**UI/Styling:**
- Tailwind CSS 4.1.17 - Utility-first CSS (`tailwind.config.ts`)
- tailwindcss-animate 1.0.7 - Animation utilities
- shadcn/ui style - Component architecture (`components.json`)

**Testing:**
- Not configured - No test framework installed

**Build/Dev:**
- TypeScript 5.9.3 - Type checking and compilation
- PostCSS 8.5.6 - CSS processing (`postcss.config.mjs`)
- ESLint 9.39.1 - Code linting (`eslint.config.mjs`)

## Key Dependencies

**Critical:**
- ioredis 5.8.2 - Redis client for data persistence (`src/connections/redis.ts`)
- semver 7.7.3 - Semantic versioning utilities (`src/models/Schema.ts`, `src/lib/versionUtils.ts`)
- date-fns 4.1.0 - Date formatting (`src/components/SchemaHistory/SchemaHistory.tsx`)

**UI:**
- lucide-react 0.555.0 - Icon library (`components.json`)
- class-variance-authority 0.7.1 - Component variants
- clsx 2.1.1 - Class name merging (`src/lib/utils.ts`)
- tailwind-merge 3.4.0 - Tailwind class deduplication (`src/lib/utils.ts`)

**Infrastructure:**
- Next.js built-in fetch - HTTP client
- Next.js Route Handlers - API endpoints

## Configuration

**Environment:**
- `.env.local` (gitignored) for secrets
- `.env.local.example` - Template with required variables
- Required: `CORS_ORIGIN`, `REDIS_URL` or `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD`/`REDIS_DB`

**Build:**
- `tsconfig.json` - TypeScript with path aliases (`@/*` → `./src/*`)
- `next.config.js` - Standalone output mode
- `tailwind.config.ts` - Content paths for src/
- `postcss.config.mjs` - Tailwind PostCSS plugin
- `eslint.config.mjs` - Next.js core-web-vitals rules
- `.prettierrc` - Formatting (no semicolons, single quotes)
- `components.json` - shadcn/ui configuration

## Platform Requirements

**Development:**
- macOS/Linux/Windows (any platform with Node.js)
- Redis server (local or cloud)
- pnpm installed globally

**Production:**
- Vercel (recommended) - Native Next.js support
- Docker/Container - `Dockerfile` and `docker-compose.yml` included
- Redis accessible via `REDIS_URL`

---

*Stack analysis: 2026-01-17*
*Update after major dependency changes*
