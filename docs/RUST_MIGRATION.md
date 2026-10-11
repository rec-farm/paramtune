# Rust runtime and Handstamp authentication

One Rust/Axum process serves static Vite assets, APIs, and Handstamp OIDC. The production image contains no Node runtime, npm packages, SQLite database, or auth sidecar. Node is used only for frontend build/development tooling.

## Authentication

Set PUBLIC_ORIGIN to the public HTTPS origin, plus OIDC_ISSUER, OIDC_CLIENT_ID, and OIDC_CLIENT_SECRET. Credentials and provider tokens stay server-only.

The openidconnect library handles authorization-code login with PKCE. It verifies signatures, issuer, audience, expiry, nonce, and any access-token hash. Userinfo must match the verified subject. Login transactions expire after ten minutes, bind to an HttpOnly browser cookie, and are consumed once. OIDC_ROLES_CLAIM defaults to groups; OIDC_ADMIN_GROUP maps its members to admin.

Sessions use random 256-bit tokens; Redis stores only their hashes with a seven-day TTL. Cookies are HttpOnly and SameSite=Lax; HTTPS uses Secure and the __Host- prefix. Every protected API and dashboard HTML request checks Redis. Missing sessions return 401; session-store outages return 503 and never grant access.

Local sign-out deletes the session and returns Handstamp's end-session URL. Signed back-channel logout revokes all sessions of the subject. Signature, issuer, audience, recent issued-at, token ID, and logout event are checked; nonce is forbidden. Replay detection and revocation are atomic in Redis across replicas. Signing keys are fetched during verification to support rotation.

Development login is enabled only with NODE_ENV=development. Sign-in methods are configured in Handstamp (or your OIDC provider); Paramtune has no production login of its own and stores no passwords.

## Cutover

Keep the registered Handstamp callback at PUBLIC_ORIGIN/api/auth/oauth2/callback/oidc, post-logout redirect at PUBLIC_ORIGIN/, and back-channel endpoint at PUBLIC_ORIGIN/api/auth/backchannel-logout.

Existing Better Auth sessions are not migrated: users sign in again. Redis configuration records, history, and audit data remain compatible. Historical authors keep their stored identity; new author IDs derive from issuer and subject. Keep the old SQLite volume separately for rollback.

Persist Redis, which now stores authentication and revocation state too. Losing auth state signs users out. Replicas share sessions when using the same Redis database and public origin. /healthz reports process liveness only. /readyz returns 200 when Redis answers PING within one second and, when OIDC_ISSUER is set, Handstamp discovery is reachable (successes are cached for 30 seconds); otherwise it returns 503 naming the failed check without error details.

Rate limits (RATE_LIMIT_AUTH_MAX sign-in requests per 15 minutes, default 10; RATE_LIMIT_API_MAX API requests per minute, default 100; per client IP) are fixed-window counters in Redis under RATE_LIMIT_PREFIX, so replicas share them. If Redis fails or takes longer than 500 ms, each process falls back to its own in-memory limiter and retries Redis after five seconds.

## Verification and rollback

Build with Rust 1.92+ and Node 22.12+. Run the lint, typecheck, unit, Rust, production build, and production browser integration commands in package.json. Backend integration tests require Redis and openssl and exercise a TLS OIDC provider with synthetic keys. E2E_REDIS_URL selects a dedicated test Redis database.

The image starts Rust directly. Local startup scripts wrap that binary with Node development tooling. For direct execution, export runtime variables and execute backend/target/release/paramtune-api. OIDC_CA_CERT_FILE optionally adds a private CA certificate; TLS verification stays enabled.

Keep the previous image and SQLite volume for rollback using current Redis configuration data.

Local tests do not verify live Handstamp registration or the reverse proxy. Verify login, roles, deep links, saves, and both logout directions on deployment before switching traffic.
