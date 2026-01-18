# ParamTune

## What This Is

A schema/configuration management system for managing versioned JSON schemas across platforms. Features a dashboard for editing schemas with inheritance support (`@extends`), Redis-backed persistence with automatic version history, and an API for external consumers.

## Core Value

**Editing schemas should be a joy, not a pain.** The editor UX is the foundation — if editing feels clunky, nothing else matters.

## Requirements

### Validated

- ✓ Platform management (create, list, view) — existing
- ✓ Version management per platform — existing
- ✓ Schema editing with JSON editor — existing
- ✓ Schema inheritance via `@extends` directive — existing
- ✓ Redis-backed persistence with version history — existing
- ✓ Dashboard with sidebar navigation — existing
- ✓ API endpoints for platforms/schemas — existing
- ✓ CORS support for external consumers — existing

### Active

- [ ] Editor UX improvements — syntax highlighting, autocomplete, better editing experience
- [ ] Schema validation — type checking, linting, validation rules before save
- [ ] API consumption — better API docs, possibly SDKs/client libraries
- [ ] Collaboration features — multi-user support, permissions, change tracking
- [ ] Performance improvements — faster loading, caching, optimization
- [ ] Reliability improvements — error handling, testing, stability

### Out of Scope

(None specified — all mentioned features are fair game)

## Context

**Current State:**
- Next.js 16 with App Router and React Server Components
- 19 client components for interactivity
- Redis sorted sets for versioned data storage
- No test framework currently installed
- shadcn/ui component architecture

**Technical Environment:**
- TypeScript 5.9.3, pnpm 10.19.0
- Tailwind CSS 4.1.17 for styling
- ioredis for Redis connectivity
- Deployable via Vercel or Docker

**Known Issues:**
- Server actions throw errors that clients see as generic (needs improvement)
- JSON.parse for schema content lacks proper try/catch
- No structured logging framework
- Console.log used for debugging

## Constraints

- **Data Store**: Redis-only — no additional databases
- **Stack**: Keep existing Next.js/React/TypeScript foundation

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Redis-only persistence | Simplicity, existing investment, version history built-in | — Pending |
| Editor UX as core priority | If editing is painful, adoption fails | — Pending |

---
*Last updated: 2026-01-17 after initialization*
