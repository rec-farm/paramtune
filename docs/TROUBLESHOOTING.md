# Troubleshooting

## Build or startup fails
- Use Node 22.12+ as required by `engines` in `package.json`.
- Verify runtime environment variables are configured on rec-farm, including `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, and Redis settings.
- Ensure `AUTH_DB_PATH` points to writable persistent storage.

## Redis connection errors
- Prefer a single `REDIS_URL`.
- If using individual settings, check host/port/password/db and networking/firewall.

## CORS errors in browser
- Set `CORS_ORIGIN` to the exact origin (including protocol), e.g. `https://yourdomain.com`.

## 404s from API
- Create the platform and add versions first via dashboard or POST endpoints.

## Type errors
- Run `pnpm typecheck` locally to see details.