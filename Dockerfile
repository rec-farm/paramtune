FROM rust:1.92-alpine AS rust-builder
RUN apk add --no-cache musl-dev
WORKDIR /app
COPY backend/Cargo.toml backend/Cargo.lock ./backend/
COPY backend/src ./backend/src
RUN cargo build --release --locked --manifest-path backend/Cargo.toml

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build:web

FROM alpine:3.23 AS runner
RUN apk add --no-cache ca-certificates && addgroup -S -g 1001 paramtune && adduser -S -u 1001 -G paramtune paramtune
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=builder /app/dist/client ./dist/client
COPY --from=rust-builder /app/backend/target/release/paramtune-api /usr/local/bin/paramtune-api
USER paramtune
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1:3000/healthz || exit 1
CMD ["paramtune-api"]
