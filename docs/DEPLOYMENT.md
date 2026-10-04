# Deployment

One Rust process serves the Vite frontend, APIs, and Handstamp authentication. Node is used only for frontend builds and development. Redis persists configuration and sessions; SQLite is no longer required. See [Rust runtime](RUST_MIGRATION.md) for cutover and rollback.

| Variable | Meaning |
| --- | --- |
| PUBLIC_ORIGIN | Public HTTPS application origin |
| OIDC_ISSUER | Handstamp issuer URL |
| OIDC_CLIENT_ID | Client registered in Handstamp |
| OIDC_CLIENT_SECRET | Client secret, authenticated using HTTP Basic |
| OIDC_SCOPES | Defaults to openid profile email groups |
| OIDC_ROLES_CLAIM | Defaults to groups |
| OIDC_ADMIN_GROUP | Group mapped to admin; other users are members |
| OIDC_DISPLAY_NAME | Defaults to Handstamp |
| OIDC_CA_CERT_FILE | Optional private-provider CA PEM file |
| CORS_ORIGIN | Defaults to PUBLIC_ORIGIN |
| REDIS_URL | Redis connection URL, credentials, and database |

Register the redirect at https://paramtune.example.com/api/auth/oauth2/callback/oidc, post-logout redirect at https://paramtune.example.com/, and back-channel logout at https://paramtune.example.com/api/auth/backchannel-logout.

Handstamp must reach the back-channel endpoint. Identity uses issuer and subject, never email linking. Groups refresh on sign-in. Configure Google and other identity providers in Handstamp.

Supply REDIS_PASSWORD, PUBLIC_ORIGIN, and OIDC credentials before building and starting Docker Compose. Persist redis_data. Keep the old auth_data volume separately for rollback; users sign in again after cutover.

Terminate HTTPS at the VPS reverse proxy and forward to Rust on port 3000. Set TRUST_PROXY=true only if the proxy sanitizes client-IP headers. Browser mutations must originate from PUBLIC_ORIGIN. VITE_* variables are public and must never contain credentials.

/healthz checks process readiness. Verify login, roles, deep links, saving, and both logout directions on the actual deployment.
