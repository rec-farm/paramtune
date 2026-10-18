# Deployment

Production HTTP monitoring is defined in [`monitoring/stillup.config.json`](../monitoring/stillup.config.json). Follow the [StillUp setup guide](../monitoring/README.md) to provision the public fixture, notifications, and GitHub deployment environment.

One Rust process serves the Vite frontend, APIs, and Handstamp authentication. Node is used only for frontend builds and development. Redis persists configuration and sessions. See [Rust runtime](RUST_MIGRATION.md) for the history of the cutover.

| Variable | Meaning |
| --- | --- |
| REDIS_PASSWORD | Redis password; Docker Compose builds REDIS_URL from it |
| PUBLIC_ORIGIN | Public HTTPS application origin |
| OIDC_ISSUER | Handstamp issuer URL |
| OIDC_CLIENT_ID | Client registered in Handstamp |
| OIDC_CLIENT_SECRET | Client secret, authenticated using HTTP Basic |
| OIDC_SCOPES | Defaults to openid profile email groups |
| OIDC_ROLES_CLAIM | Defaults to groups |
| OIDC_ADMIN_GROUP | Group mapped to admin; when set, only admins delete platforms/versions, make platforms public, and manage API tokens |
| OIDC_EDITOR_GROUP | When set, only this group (and admins) can change configuration; other users are view-only |
| OIDC_PLATFORM_EDITORS | Optional per-platform editor groups, e.g. `ios:team-ios,team-mobile;web:team-web`; admins are exempt |
| OIDC_DISPLAY_NAME | Defaults to Handstamp |
| OIDC_CA_CERT_FILE | Optional private-provider CA PEM file (a path inside the container; mount the file too) |
| CORS_ORIGIN | Defaults to PUBLIC_ORIGIN |
| REDIS_URL | Redis connection URL, credentials, and database (set by Docker Compose) |
| TRUST_PROXY | true only behind a proxy that sanitizes client-IP headers; defaults to false |
| RATE_LIMIT_API_MAX | API requests per client IP per minute; defaults to 100 |
| RATE_LIMIT_AUTH_MAX | Sign-in requests per client IP per 15 minutes; defaults to 10 |
| RATE_LIMIT_PREFIX | Redis key prefix for shared rate-limit counters; defaults to ratelimit |

Register the redirect at https://paramtune.example.com/api/auth/oauth2/callback/oidc, post-logout redirect at https://paramtune.example.com/, and back-channel logout at https://paramtune.example.com/api/auth/backchannel-logout.

Handstamp must reach the back-channel endpoint. Identity uses issuer and subject, never email linking. Groups refresh on sign-in. Upstream sign-in (passkeys, GitHub and other providers) is configured in Handstamp, not in Paramtune. Any other standard OpenID Connect provider works in place of Handstamp.

Copy `.env.example` to `.env`, fill in REDIS_PASSWORD, PUBLIC_ORIGIN and the OIDC credentials, then run `docker compose up --build -d`. Compose passes every variable above to the app. Persist redis_data.

To trust a private CA, mount the PEM file and point OIDC_CA_CERT_FILE at it, for example in a `docker-compose.override.yml`:

```yaml
services:
  app:
    volumes:
      - ./handstamp-ca.pem:/etc/paramtune/ca.pem:ro
    environment:
      - OIDC_CA_CERT_FILE=/etc/paramtune/ca.pem
```

Terminate HTTPS at the VPS reverse proxy and forward to Rust on port 3000. Set TRUST_PROXY=true only if the proxy sanitizes client-IP headers. Browser mutations must originate from PUBLIC_ORIGIN. VITE_* variables are public and must never contain credentials.

Use /healthz for liveness (process restarts) and /readyz for readiness (routing traffic): /readyz returns 503 while Redis or, when configured, Handstamp discovery is unreachable. The Docker healthcheck stays on /healthz so a Redis or provider outage does not restart healthy processes. Rate limits are shared across replicas through Redis; tune them with RATE_LIMIT_API_MAX and RATE_LIMIT_AUTH_MAX. Verify login, roles, deep links, saving, and both logout directions on the actual deployment.
