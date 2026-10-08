# Docker

The multi-stage build uses Rust and Node builders. The final Alpine image contains the Rust binary, static Vite assets, and CA certificates. It runs unprivileged and starts Rust directly, without Node or node_modules.

Build with `docker build -t paramtune .`. Supply REDIS_PASSWORD, PUBLIC_ORIGIN, OIDC_ISSUER, OIDC_CLIENT_ID, and OIDC_CLIENT_SECRET before starting Docker Compose.

See [deployment](DEPLOYMENT.md) for Handstamp registration and proxy settings. Persist Redis configuration and authentication state. Keep the previous image for rollback.

The development Compose file includes Node and Rust tooling for Vite and a development-only login. Node remains necessary for frontend development.
