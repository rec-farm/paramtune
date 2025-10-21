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
