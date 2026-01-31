# ParamTune

## What This Is

A schema/configuration management system for managing versioned JSON schemas across platforms. Features a dashboard with syntax-highlighted JSON editor, autocomplete, real-time validation, schema comparison with visual diff, Redis-backed persistence with version history, and documented REST API for external consumers.

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
- ✓ Autocomplete with contextual JSON suggestions — v1.0
- ✓ Light/dark theme support for syntax highlighting — v1.0
- ✓ Real-time validation with error/warning distinction — v1.0
- ✓ Pre-save @extends dependency validation — v1.0
- ✓ React Error Boundaries for graceful error recovery — v1.0
- ✓ Type-safe API error handling — v1.0
- ✓ OpenAPI specification and API documentation page — v1.0
- ✓ Smart autocomplete (respects user navigation intent) — v1.1
- ✓ Schema diff engine with type change detection — v1.1
- ✓ Side-by-side schema comparison UI — v1.1
- ✓ Hover-only error tooltips (less intrusive UX) — v1.1
- ✓ Validation loading indicator — v1.1
- ✓ Lag-free typing with debounced syntax highlighting — v1.2
- ✓ Lazy loading for faster page loads — v1.2
- ✓ Modern shadow system and card variants — v1.2
- ✓ Mobile-responsive dashboard with hamburger menu — v1.2
- ✓ Touch-friendly 40px targets on mobile — v1.2

### Active

- [ ] User authentication via BetterAuth with Google SSO
- [ ] Audit trail — track who made each schema change
- [ ] Version history with author attribution and restore capability

### Future

- [ ] Testing — unit tests, integration tests, E2E tests
- [ ] Structured logging — replace console.log with proper logging
- [ ] Additional SSO providers (GitHub, Microsoft)
- [ ] Role-based permissions (admin/editor/viewer)

### Out of Scope

- SDK/client libraries — API is documented, consumers can use fetch
- Mobile app — web-first approach, responsive design works

## Context

## Current Milestone: v1.3 User System & Audit Trail

**Goal:** Enable team accountability by tracking who makes each schema change with full version history.

**Target features:**
- BetterAuth integration with Google SSO
- User sessions that persist across refreshes
- Author metadata on every schema version
- Version history UI with author attribution and restore capability
- All authenticated users have equal permissions (no roles)

---

**Current State (v1.2):**
- Next.js 16 with App Router and React Server Components
- 8,115 lines of TypeScript across 75 files
- JSON editor with autocomplete, validation, debounced syntax highlighting
- Light/dark theme support with modern shadow system
- Schema comparison with visual diff at /dashboard/compare
- React Error Boundaries on all dashboard routes
- Type-safe API error handling with dev/prod distinction
- OpenAPI 3.0 spec at /openapi.yaml
- API docs page at /api-docs
- Mobile-responsive with hamburger menu and touch-friendly targets
- Lazy loading for optimized page loads

**Technical Environment:**
- TypeScript 5.9.3, pnpm 10.19.0
- Tailwind CSS 4.1.17 for styling
- ioredis for Redis connectivity
- Deployable via Vercel or Docker

**Known Issues:**
- No test framework currently installed
- No structured logging framework (console.log still used)

## Constraints

- **Data Store**: Redis-only — no additional databases
- **Stack**: Keep existing Next.js/React/TypeScript foundation

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Redis-only persistence | Simplicity, existing investment, version history built-in | ✓ Good |
| Editor UX as core priority | If editing is painful, adoption fails | ✓ Good — autocomplete + validation shipped |
| Pure TypeScript autocomplete | No external libraries, full control | ✓ Good |
| 100ms debounce for suggestions | Balance responsiveness and performance | ✓ Good |
| Separate actions file for server imports | Next.js client/server component separation | ✓ Good |
| Warnings don't block save | Only errors should prevent saving | ✓ Good |
| Dev/prod error distinction | Helpful for debugging, safe in production | ✓ Good |
| OpenAPI 3.0.3 format | Broad compatibility with tools | ✓ Good |
| Enter respects navigation state | VS Code-like behavior, less frustrating | ✓ Good |
| No external diff libraries | Existing logic sufficient, keeps bundle lean | ✓ Good |
| Server actions for comparison | Keep client components lightweight | ✓ Good |
| Hover-only error tooltips | Less visual noise while typing | ✓ Good |
| 50ms debounce for syntax highlighting | Matches autocomplete, eliminates lag | ✓ Good |
| CSS custom properties for shadows | Consistent theming, easy to maintain | ✓ Good |
| Card variants as CSS classes | Reusable, maintainable | ✓ Good |
| Mobile header with existing glass class | Consistency with dashboard cards | ✓ Good |
| 40px touch targets on mobile | WCAG accessibility guidelines | ✓ Good |

---
*Last updated: 2026-01-31 after v1.3 milestone started*
