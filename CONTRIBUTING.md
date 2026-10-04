# Contributing

Thanks for taking the time to improve Paramtune.

## Development Setup

Requirements:

- Node.js 20 or newer
- pnpm 10.x
- Redis

Install dependencies:

```bash
pnpm install
cp .env.local.example .env.local
```

Start Redis with Docker:

```bash
docker-compose -f docker-compose.dev.yml up redis
```

Start the app (requires a global `portless` install: `npm install -g portless`):

```bash
pnpm dev
```

Use `pnpm dev:direct` to skip portless and run on `localhost:3000`.

## Checks

Run these before opening a pull request:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm audit --audit-level moderate
```

## Code Style

- Use `@/*` path aliases for imports from `src/`.
- Use single quotes, no semicolons, and 2-space indentation.
- Mark client components with `'use client'`.
- Use `cn()` for conditional class name merging.
- Prefer type guards and explicit error handling over broad casts.
- Keep changes scoped to the behavior you are modifying.

## Pull Requests

Include:

- What changed and why
- Any migration or deployment impact
- Screenshots for UI changes
- The checks you ran locally
