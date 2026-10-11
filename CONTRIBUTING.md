# Contributing

Thanks for taking the time to improve Paramtune. Everyone taking part is expected to follow the
[rec-farm Code of Conduct](https://github.com/rec-farm/.github/blob/main/CODE_OF_CONDUCT.md).
To report a vulnerability, use
[private vulnerability reporting](https://github.com/rec-farm/paramtune/security/advisories/new),
not a public issue.

## Prerequisites

- Node.js 22.12 or newer
- pnpm 10.x (the exact version is pinned in `package.json` under `packageManager`)
- Rust 1.92 or newer, with `rustfmt` and `clippy`
- Redis (Docker is the easiest way to run it locally)
- `openssl`, used by the backend OIDC integration tests

## Run it locally

```bash
pnpm install
cp .env.local.example .env.local
docker compose -f docker-compose.dev.yml up redis
```

Start the app (requires a global [portless](https://github.com/vercel-labs/portless) install:
`npm install -g portless`; never add it as a project dependency):

```bash
pnpm dev
```

Use `pnpm dev:direct` to skip portless and run on `http://localhost:3000`. Rust compiles at
startup; restart the dev command after Rust changes. Vite keeps frontend hot reload.

## Before opening a pull request

Run the full check and make sure it passes:

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm backend:check && pnpm backend:test
```

`pnpm backend:test` needs Redis running and `openssl` installed. If you changed routing, auth,
mutations or production serving, also run the production browser suite against a dedicated Redis
database:

```bash
pnpm build
pnpm exec playwright install chromium
E2E_REDIS_URL=redis://127.0.0.1:6379/15 pnpm test:e2e:ci
```

CI also runs `pnpm build` and `pnpm audit --audit-level moderate`.

## Commits and pull requests

- Use [Conventional Commits](https://www.conventionalcommits.org/), as in the existing history:
  `feat(auth): ...`, `fix(api): ...`, `docs: ...`, `chore: ...`.
- One change per pull request. Keep it scoped to the behavior you are modifying.
- In the description, say what changed and why, any deployment impact, the checks you ran, and
  include screenshots (Dark and Paper themes) for UI changes.

## Project rules

- **No passwords.** People sign in over standard OpenID Connect (Handstamp or any OIDC provider);
  any OIDC provider must keep working. A development-only login exists for local work.
- **Identity is `(issuer, subject)`.** Never link or merge accounts by email.
- **Every dashboard endpoint validates its session.** Browser redirects are not authorization.
- **Secrets never reach logs or API responses,** beyond a one-time reveal (for example, a newly
  created API token). Never commit `.env` or `.env.local`.
- **CSP:** production uses `script-src 'self'`: no inline scripts. Don't add new React
  `style={...}` props; use classes. The target is `style-src 'self'`; for now the CSP
  still allows `'unsafe-inline'` styles because the JSON editor uses a few.
- **Browser code** lives in `src/client` and `src/components` and never imports server modules.
- **Design:** UI follows [DESIGN.md](DESIGN.md) and the
  [R.E.C. design system](https://github.com/rec-farm/rec-brand). Don't edit the copied token block
  in `src/client/tokens.css`; re-copy it from a newer rec-brand tag.

## Code style

- Use `@/*` path aliases for imports from `src/`.
- Single quotes, no semicolons, 2-space indentation (Prettier and ESLint enforce this).
- Use `cn()` for conditional class name merging.
- Prefer type guards and explicit error handling over broad casts.
- Rust code passes `cargo fmt` and `cargo clippy -D warnings` (`pnpm backend:check`).
