# Architecture

Vite builds React assets; React Router owns browser routes and loaders. One Rust/Axum process serves protected APIs, static production assets, and Handstamp OIDC. Redis stores configuration versions, dependencies, history, audit records, login transactions, sessions, and revocation state.

Every protected API and dashboard HTML request independently checks its session. Credentials and provider tokens remain server-only. Handstamp authenticates users; Rust verifies OIDC responses and issues opaque HttpOnly session cookies. See [Rust runtime](RUST_MIGRATION.md).

Node is used for frontend builds, development, and tests. The optional Node reference API and auth libraries are development dependencies, excluded from the production image.
