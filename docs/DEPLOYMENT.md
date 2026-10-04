# Deployment

## Rust, Node auth, and Docker

Use Rust 1.92+ for builds, Node 22.12+ for authentication, and persistent Redis/SQLite storage. See [Rust migration](RUST_MIGRATION.md) for runtime settings and compatibility checks. Preserve BETTER_AUTH_URL, BETTER_AUTH_SECRET, AUTH_DB_PATH, and data volumes when upgrading.

```sh
pnpm install --frozen-lockfile
pnpm build
# Optional preflight migration after taking a backup:
NODE_ENV=production pnpm auth:migrate:production
pnpm start
```

The start command defaults to production. PORT defaults to 3000 and HOST to 0.0.0.0. Rust serves dist/client and authenticated APIs. The supervisor starts auth on an automatically allocated loopback port. /healthz checks Rust and auth readiness, not Redis readiness.

For Docker: build with docker compose build, docker compose up -d. Provide REDIS_PASSWORD, BETTER_AUTH_SECRET, BETTER_AUTH_URL, and Google or OIDC credentials. Existing redis_data and auth_data volumes remain compatible. The image runs unprivileged.

Terminate HTTPS at a reverse proxy. Set TRUST_PROXY=true only when it sanitizes client-IP headers. CORS_ORIGIN controls API reads; browser mutations originate from BETTER_AUTH_URL. Non-browser clients may omit Origin but still require a session and application/json.

The server creates and updates authentication tables before accepting requests, including the OIDC role column. Back up SQLite before upgrades.

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

## rec-farm hosting

Deploy the Docker image on rec-farm with persistent Redis and SQLite volumes.
Route the public HTTPS origin to the Rust application on port 3000; it serves
both the frontend and API. Set BETTER_AUTH_URL and CORS_ORIGIN to that public
origin and register matching Google/OIDC callback URLs.

Keep secrets in runtime environment variables. VITE_* variables are public and
must never contain secrets. No separate frontend host or API proxy build is
required. Verify provider sign-in, cookies, deep-link reloads, and saving on the
actual deployment before switching traffic.

Public routes retain prerendered HTML. Dashboard shells are uncached, and API
requests enforce authorization. Unknown API paths never fall through to frontend HTML.

## Rollback

Set PARAMTUNE_BACKEND=node and restart to use the included Node backend with the same data. Keep the previous image. No stored-data format changes are introduced. Roll back application code with the same volumes, signing secret, and public URL. Preserve post-cutover writes rather than restoring stale database snapshots.
