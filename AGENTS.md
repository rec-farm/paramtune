# Agents

## Development Commands

- Lint: `pnpm lint`
- Type check: `pnpm typecheck`
- Build: `pnpm build`
- Dev server: `pnpm dev`
- Bundle analysis: `pnpm analyze`

## Code Style Guidelines

- Use `@/*` path aliases for imports from `src/`
- Single quotes, no semicolons, 2-space indentation
- TypeScript strict mode enabled
- Components use forwardRef with displayName
- Error handling with try/catch and type guards
- Use cn() utility for conditional className merging
- Client components marked with 'use client'
- Props interfaces extend HTML element attributes where appropriate

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
