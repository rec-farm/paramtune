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
- `OIDC_*` = optional "Sign in with Handstamp" (any OpenID Connect provider works), see below

The auth tables in `AUTH_DB_PATH` are created, and new columns added, automatically when the
server starts. There is no separate migration step.

## Sign in with Handstamp (OIDC)

Set these to show a "Sign in with Handstamp" button. They are read at runtime, so one image
works with or without them. When `OIDC_ISSUER` or `OIDC_CLIENT_ID` is empty the button is
hidden and the other sign-in methods keep working.

| Variable             | Default                       | Meaning                                                                 |
| -------------------- | ----------------------------- | ----------------------------------------------------------------------- |
| `OIDC_ISSUER`        |                               | Issuer URL, no trailing slash, e.g. `https://id.rec.farm`               |
| `OIDC_CLIENT_ID`     |                               | Client ID from the app's page in Handstamp, e.g. `paramtune`            |
| `OIDC_CLIENT_SECRET` |                               | Client secret (sent with HTTP Basic, `client_secret_basic`)            |
| `OIDC_SCOPES`        | `openid profile email groups` | Scopes to request                                                       |
| `OIDC_ROLES_CLAIM`   | `groups`                      | Claim holding the user's groups                                         |
| `OIDC_ADMIN_GROUP`   |                               | Members of this group get `role = admin`, everyone else `member`        |
| `OIDC_DISPLAY_NAME`  | `Handstamp`                   | Button label: "Sign in with …"                                          |

Register the app at the provider with these URIs (`BETTER_AUTH_URL` is the app's origin):

- Redirect URI: `https://paramtune.example.com/api/auth/oauth2/callback/oidc`
- Post-logout redirect URI: `https://paramtune.example.com/`
- Back-channel logout URI: `https://paramtune.example.com/api/auth/backchannel-logout`

Name, email and role are refreshed from the provider at every sign-in. Accounts are keyed on
the provider's `sub` and are never linked by email. Signing out of Paramtune also ends the
Handstamp session (RP-initiated logout), and signing out at Handstamp ends every Paramtune
session of that person through the back-channel logout URI, which must be reachable from the
Handstamp server.

## Vercel

Vercel can be used for preview deployments or for production deployments that replace the default local SQLite auth database with persistent auth storage. The default `better-sqlite3` database is file-based and requires writable persistent storage, which serverless deployments do not provide by default.

## Project Settings

- `vercel.json` provides security headers globally.
- API routes run on the Node.js runtime.
- Use Vercel Analytics/Monitoring as needed.

## Static Assets

- Place static assets under `public/` to leverage Vercel CDN.
