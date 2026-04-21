# Deployment

## Prerequisites

- A GitHub or GitLab repository for the project
- Redis
- A writable persistent volume for the SQLite auth database, unless you replace auth storage

## Docker

Docker Compose is the recommended self-hosted deployment path because it provides persistent volumes for Redis and auth data.

```bash
export REDIS_PASSWORD="$(openssl rand -base64 24)"
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
export BETTER_AUTH_URL="https://paramtune.example.com"
export CORS_ORIGIN="https://paramtune.example.com"
docker-compose up --build -d
```

## Environment Variables

- `CORS_ORIGIN` = your production domain (e.g. `https://paramtune.example.com`)
- `REDIS_URL` or host/port/password/db variables
- `BETTER_AUTH_SECRET` = a strong random secret (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL` = your production domain (e.g. `https://paramtune.example.com`)
- `AUTH_DB_PATH` = SQLite database path for auth data (default Docker value: `/app/data/auth.db`)
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` = Google OAuth credentials

## Vercel

Vercel can be used for preview deployments or for production deployments that replace the default local SQLite auth database with persistent auth storage. The default `better-sqlite3` database is file-based and requires writable persistent storage, which serverless deployments do not provide by default.

## Project Settings

- `vercel.json` provides security headers globally.
- API routes run on the Node.js runtime.
- Use Vercel Analytics/Monitoring as needed.

## Static Assets

- Place static assets under `public/` to leverage Vercel CDN.
