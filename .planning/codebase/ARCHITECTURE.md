# Architecture

**Analysis Date:** 2026-01-17

## Pattern Overview

**Overall:** Full-Stack Next.js 16 Monolithic Application with Server-Component-First Architecture

**Key Characteristics:**
- App Router with React Server Components
- Redis-backed data persistence (no traditional database)
- Server Actions for mutations (form submissions)
- Client Components for interactivity (19 components marked `'use client'`)
- Standalone deployment mode for containerization

## Layers

**Presentation Layer (Pages):**
- Purpose: Server-rendered pages with selective client interactivity
- Contains: Page components, layouts, route handlers
- Location: `src/app/`
- Depends on: Models (data fetching), Components (UI)
- Used by: Next.js routing system

**API Layer (Route Handlers):**
- Purpose: RESTful HTTP endpoints for external consumers
- Contains: GET/POST handlers with CORS support
- Location: `src/app/api/`
- Depends on: Models for data operations
- Used by: External API consumers

**Model Layer (Business Logic):**
- Purpose: Data operations, schema composition, dependency resolution
- Contains: Platform, Version, Schema models with server functions
- Location: `src/models/`
- Depends on: Redis connection (`src/connections/redis.ts`)
- Used by: Pages (via server actions), API routes

**Component Layer (UI):**
- Purpose: Reusable React components
- Contains: UI primitives (`ui/`), feature components (JsonEditable, SchemaHistory)
- Location: `src/components/`
- Depends on: Utility functions (`src/lib/`)
- Used by: Page components

**Utility Layer:**
- Purpose: Shared helpers and functions
- Contains: Class name utils, version sorting, file operations
- Location: `src/lib/`
- Depends on: External packages (clsx, semver)
- Used by: Components, Models

**Connection Layer:**
- Purpose: External service integrations
- Contains: Redis client factory with connection pooling
- Location: `src/connections/`
- Depends on: ioredis package
- Used by: Models

## Data Flow

**Schema Creation/Update Flow:**

1. User edits schema in JsonEditable component (`src/components/JsonEditable/`)
2. Form submitted via FormData to server action
3. `updateSchema()` called in `src/app/dashboard/[platform]/[version]/page.tsx`
4. `saveSchema()` in `src/models/Schema.ts`:
   - Extract `@extends` dependencies from content
   - Resolve semver ranges (latest, ^, ~, exact)
   - Recursively merge inherited schemas
   - Store in Redis sorted set with timestamp
   - Track reverse dependencies
   - Cascade updates to dependent schemas
5. `revalidatePath()` refreshes Next.js cache

**Platform Navigation Flow:**

1. GET `/dashboard` → `getPlatforms()` → Redis SCAN + batch fetch
2. Render platform grid with version counts
3. Click platform → GET `/dashboard/[platform]` → `getPlatform()`
4. Display versions and creation form
5. Click version → GET `/dashboard/[platform]/[version]`
6. Render SchemaTabs with Editor/Preview/History

**State Management:**
- Server: Redis sorted sets for versioned data (history built-in)
- Client: React Context for sidebar state (`src/contexts/SidebarContext.tsx`)
- Forms: Server Actions with `revalidatePath()` for cache invalidation

## Key Abstractions

**Server Actions:**
- Purpose: Secure server-side mutations from client forms
- Examples: `createPlatform()`, `createVersion()`, `updateSchema()`
- Pattern: `'use server'` directive in page or model files
- Location: `src/app/dashboard/*/page.tsx`, `src/models/*.ts`

**Redis Sorted Sets:**
- Purpose: Versioned data storage with built-in history
- Pattern: `zadd(key, timestamp, JSON.stringify(data))`
- Retrieval: `zrevrangebyscore(key, '+inf', '-inf', 'LIMIT', 0, 1)` for latest
- Examples: `platforms:{id}`, `schemas:{platform}:{version}`

**Schema Composition:**
- Purpose: Inheritance via `@extends` directive
- Pattern: Deep merge of parent schemas with circular dependency detection
- Location: `src/models/Schema.ts` - `processNodeWithExtends()`, `resolveDependencies()`
- Format: `"@extends": ["mobile/1.0.0", "base/^2.0"]`

**Component Patterns:**
- UI components use `forwardRef` with `displayName` (`src/components/ui/`)
- Feature components in named directories with `index.ts` barrel exports
- Client components marked with `'use client'` directive

## Entry Points

**Web Application:**
- Location: `src/app/layout.tsx`
- Triggers: Browser navigation
- Responsibilities: Root HTML, metadata, font loading

**Dashboard:**
- Location: `src/app/dashboard/layout.tsx`
- Triggers: `/dashboard/*` routes
- Responsibilities: Sidebar, navigation, Redis health check

**API:**
- Location: `src/app/api/*/route.ts`
- Triggers: HTTP requests to `/api/*`
- Responsibilities: CRUD operations for platforms/schemas

**Middleware:**
- Location: `src/middleware.ts`
- Triggers: All `/api/*` requests
- Responsibilities: CORS headers, security headers

## Error Handling

**Strategy:** Throw errors in models, catch at page/route boundaries

**Patterns:**
- Models throw descriptive errors: `throw new Error('Circular dependency detected')`
- Route handlers catch and return JSON: `NextResponse.json({ error }, { status: 500 })`
- Dashboard layout gracefully handles Redis failures (shows warning)
- Server actions throw, client sees generic error (needs improvement)

## Cross-Cutting Concerns

**Logging:**
- Console.log for debugging and errors
- No structured logging framework

**Validation:**
- JSON.parse for schema content (needs try/catch)
- Basic form validation in components
- Semver validation via `semver` package

**Caching:**
- Next.js built-in caching with `revalidatePath()`
- Redis serves as primary store (no separate cache layer)
- API responses set `Cache-Control: no-store` for dynamic data

---

*Architecture analysis: 2026-01-17*
*Update when major patterns change*
