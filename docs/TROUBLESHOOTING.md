# Troubleshooting

## Build fails on Vercel
- Ensure Node version is within `engines` in `package.json` (20–22).
- Verify environment variables are set in Vercel Project Settings.

## Redis connection errors
- Prefer a single `REDIS_URL`.
- If using individual settings, check host/port/password/db and networking/firewall.

## CORS errors in browser
- Set `CORS_ORIGIN` to the exact origin (including protocol), e.g. `https://yourdomain.com`.

## 404s from API
- Create the platform and add versions first via dashboard or POST endpoints.

## Type errors
- Run `pnpm typecheck` locally to see details.