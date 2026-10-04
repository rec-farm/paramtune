# Agents

## Development Commands

- Lint: `pnpm lint`
- Type check: `pnpm typecheck`
- Build: `pnpm build`
- Rust checks: `pnpm backend:check`
- Rust tests: `pnpm backend:test`
- Dev server: `pnpm dev`
- Bundle analysis: `pnpm analyze`

## Code Style Guidelines

- Use `@/*` path aliases for imports from `src/`
- Single quotes, no semicolons, 2-space indentation
- TypeScript strict mode enabled
- Components use forwardRef with displayName
- Error handling with try/catch and type guards
- Use cn() utility for conditional className merging
- Browser code lives in src/client and src/components; never import server modules there
- Props interfaces extend HTML element attributes where appropriate

## Runtime boundaries

- Vite builds the browser app; Axum on Rust serves authenticated APIs and production assets; the loopback-only Hono/Node sidecar handles Better Auth. The Node API remains as a rollback reference.
- Keep Redis, SQLite, auth configuration, and audit logging server-only.
- Shared JSON contracts and browser-safe validation live in src/shared and src/lib.
- Every dashboard endpoint must validate its session; browser redirects are not authorization.
- Run pnpm test:e2e:ci after changing routing, auth, mutations, or production serving.
