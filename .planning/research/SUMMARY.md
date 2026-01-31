# Research Summary

**Project:** ParamTune v1.3 - User System & Audit Trail
**Domain:** Authentication & Audit for Schema Management Tool
**Synthesized:** 2026-01-31
**Confidence:** HIGH

## Executive Summary

Adding user authentication and audit trail to ParamTune follows well-established patterns from developer tooling. BetterAuth v1.4.x with Google OAuth is the recommended approach, using the existing Redis connection for session caching while adding SQLite via better-sqlite3 for auth tables (BetterAuth requires SQL for user/session storage). The audit trail integrates naturally into the existing schema versioning mechanism by embedding author metadata in each Redis ZADD entry, requiring no separate audit infrastructure.

The key technical decision is using a hybrid storage model: SQLite for BetterAuth's core tables (user, session, account) and Redis for session caching + author-enriched schema versions. This respects the existing Redis-centric architecture while meeting BetterAuth's SQL requirement. The approach adds only 2 npm packages (better-auth, better-sqlite3) and creates minimal new infrastructure.

Primary risks are: (1) breaking existing public API routes with overly aggressive middleware, (2) false security from cookie-only checks without server-side validation, and (3) legacy schema data lacking author fields. All are addressed through careful phase ordering: define protected vs public routes first, implement defense-in-depth auth patterns, and handle null authors gracefully in the UI.

## Key Findings

### Recommended Stack

BetterAuth is the clear choice over NextAuth.js for new Next.js 16 projects. It has better TypeScript support, cleaner API, and built-in Google OAuth. SQLite via better-sqlite3 is the lowest-friction SQL option that satisfies BetterAuth's database requirement without adding cloud dependencies.

**Core technologies:**
- **better-auth ^1.4.18:** Authentication framework with Google OAuth, session management, Next.js 16 compatible
- **better-sqlite3 ^11.x:** Zero-infrastructure SQL database for auth tables (user, session, account, verification)
- **ioredis ^5.8.2 (existing):** Secondary storage for fast session lookups and schema versioning with author metadata

**Installation:**
```bash
pnpm add better-auth better-sqlite3
pnpm add -D @types/better-sqlite3
```

### Expected Features

**Must have (table stakes):**
- Google SSO login/logout
- Persistent sessions (stay logged in across browser restarts)
- Protected dashboard routes
- User avatar/name in header
- Author name on schema versions
- Version history with author attribution
- Login redirect flow (return to intended page)

**Should have (competitive):**
- Inline author badges in version history
- Version restore capability
- Author filtering in history

**Defer (v2+):**
- Role-based permissions
- Email/password auth
- Change approval workflows
- Detailed action logging (views, searches)
- Real-time collaboration

### Architecture Approach

The integration follows a layered auth pattern: lightweight cookie check in middleware for UX (redirect to login), full session validation in Server Components and Server Actions for security. Author attribution embeds in existing Redis schema versions via extended Schema type. No separate audit log infrastructure needed.

**Major components:**
1. **lib/auth.ts** — BetterAuth server config with Redis secondary storage, Google OAuth, nextCookies plugin
2. **lib/auth-client.ts** — Client hooks for signIn/signOut, session state
3. **/api/auth/[...all]/route.ts** — Catch-all BetterAuth HTTP handler
4. **middleware.ts (modified)** — Session cookie check for /dashboard/*, existing CORS for /api/*
5. **lib/dal.ts** — getSessionOrRedirect() helper with React.cache() memoization
6. **Schema.ts (modified)** — Extended type with optional authorId, authorEmail, authorName fields

### Critical Pitfalls

1. **Breaking existing API routes** — Add auth incrementally. Start with /dashboard/* protection only. Public API routes remain unprotected for v1.3. Verify external integrations still work.

2. **Cookie-only false security** — Cookie checks in middleware are for UX redirects only. Always validate session in Server Components, API routes, and Server Actions. CVE-2025-29927 demonstrated middleware bypass risks.

3. **Legacy data without authors** — Make author fields optional in Schema type. Display "Unknown" gracefully for null authors. Consider "SYSTEM" user for backfill if needed.

4. **Google OAuth redirect_uri_mismatch** — Set BETTER_AUTH_URL environment variable correctly. Configure Google Console with all callback URLs (localhost, staging, production). Don't use offline_access scope.

5. **Next.js 16 proxy/middleware naming** — BetterAuth docs reference "middleware" but Next.js 16 renamed to "proxy". Use getSessionCookie helper, keep checks lightweight, validate in Server Components.

## Implications for Roadmap

### Phase 1: Auth Infrastructure
**Rationale:** Core auth must exist before any protected routes or author attribution
**Delivers:** Working Google OAuth login/logout, session persistence
**Uses:** better-auth, better-sqlite3, existing ioredis
**Addresses:** Google SSO login, persistent sessions, logout
**Avoids:** Breaking existing routes by defining protected vs public upfront

**Components:**
- lib/auth.ts (BetterAuth config)
- lib/auth-client.ts (client hooks)
- /api/auth/[...all]/route.ts (route handler)
- /login/page.tsx (login UI)
- Environment variables setup

### Phase 2: Route Protection
**Rationale:** After auth works, protect dashboard routes and add user display
**Delivers:** Protected dashboard, user info in header, secure server actions
**Implements:** Middleware modification, DAL pattern, session validation
**Avoids:** Cookie-only false security via defense-in-depth pattern

**Components:**
- middleware.ts modification (add /dashboard/* check)
- lib/dal.ts (getSessionOrRedirect helper)
- dashboard/layout.tsx modification (fetch and pass session)
- UserMenu component (avatar, logout)

### Phase 3: Author Attribution
**Rationale:** With auth working, add author metadata to schema saves
**Delivers:** Every schema change tagged with who made it
**Addresses:** Author on schema versions, audit trail data
**Avoids:** Legacy null author issues via optional fields

**Components:**
- Schema.ts type extension (authorId, authorEmail, authorName)
- saveSchema() modification (accept author parameter)
- Server action modification (pass session.user to saveSchema)

### Phase 4: Audit Trail UI
**Rationale:** Author data exists, now display it in version history
**Delivers:** Version history shows who made each change
**Addresses:** Version history with authors, author display
**Avoids:** UI crashes on null authors via graceful fallback

**Components:**
- SchemaHistory component modification (display author)
- Author avatar/badge rendering
- "Unknown" fallback for legacy versions

### Phase Ordering Rationale

- **Auth before protection:** Can't protect routes without auth infrastructure
- **Protection before attribution:** Need session access before passing user to saves
- **Attribution before UI:** Need data stored before displaying it
- **Each phase is independently shippable:** Auth alone adds value, protection adds security, attribution adds auditability, UI makes it visible

### Research Flags

**Phases likely needing deeper research during planning:**
- None identified. All patterns are well-documented in BetterAuth and Next.js official docs.

**Phases with standard patterns (skip research-phase):**
- **All phases:** BetterAuth has comprehensive Next.js integration docs. Schema modification follows existing codebase patterns. UI work is straightforward React.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | BetterAuth docs verified, active maintenance (v1.4.18), Next.js 16 compatible |
| Features | HIGH | Well-established patterns across developer tools, competitor analysis confirms |
| Architecture | HIGH | Official BetterAuth integration docs, matches Next.js auth guide patterns |
| Pitfalls | MEDIUM | BetterAuth-specific verified via docs/issues; some integration patterns from community |

**Overall confidence:** HIGH

### Gaps to Address

- **SQLite file location:** Need to decide on data directory structure (./data/auth.sqlite suggested). Ensure .gitignore includes SQLite files for local dev.
- **Session duration:** BetterAuth defaults may need tuning. Consider cookie maxAge for "remember me" behavior.
- **Existing schema backfill:** Decision needed on whether to backfill legacy versions with "SYSTEM" author or leave as null. UI handles either.

## Sources

### Primary (HIGH confidence)
- [BetterAuth Next.js Integration](https://www.better-auth.com/docs/integrations/next) — route handlers, middleware, cookies
- [BetterAuth Google OAuth](https://www.better-auth.com/docs/authentication/google) — configuration, scopes
- [BetterAuth Session Management](https://www.better-auth.com/docs/concepts/session-management) — Redis secondary storage
- [BetterAuth Database Concepts](https://www.better-auth.com/docs/concepts/database) — SQL requirement
- [BetterAuth SQLite Adapter](https://www.better-auth.com/docs/adapters/sqlite) — better-sqlite3 setup
- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication) — patterns, CVE-2025-29927

### Secondary (MEDIUM confidence)
- [Confluent Schema Registry Audit Events](https://docs.confluent.io/cloud/current/monitoring/audit-logging/event-methods/sr-management.html) — competitor patterns
- [LaunchDarkly Change History](https://docs.launchdarkly.com/home/code/audit-log-history) — audit trail expectations
- [Flagsmith Feature Flags](https://www.flagsmith.com/feature-flags-and-remote-config) — competitor simplicity baseline
- [BetterAuth GitHub Issues](https://github.com/better-auth/better-auth/issues) — Next.js 16 caching, Google OAuth scope issues

### Tertiary (LOW confidence)
- Community blog posts on audit trail patterns — general guidance, not BetterAuth-specific

---
*Research completed: 2026-01-31*
*Ready for roadmap: yes*
