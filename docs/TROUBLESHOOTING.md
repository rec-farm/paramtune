# Troubleshooting

## Build or startup fails
- Use Node 22.12+ as required by `engines` in `package.json`.
- Verify runtime environment variables are configured in your deployment (for example `.env` for Docker Compose), including `PUBLIC_ORIGIN`, `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, and Redis settings.
- Ensure Redis is reachable and its data volume is persistent.

## Redis connection errors
- Prefer a single `REDIS_URL`.
- If using individual settings, check host/port/password/db and networking/firewall.

## CORS errors in browser
- Set `CORS_ORIGIN` to the exact origin (including protocol), e.g. `https://yourdomain.com`.

## 404s from API
- Create the platform and add versions first via dashboard or POST endpoints.

## Type errors
- Run `pnpm typecheck` locally to see details.