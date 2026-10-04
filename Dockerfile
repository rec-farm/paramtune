FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS dependencies
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS builder
COPY . .
RUN pnpm build
RUN pnpm prune --prod

FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV AUTH_DB_PATH=/app/data/auth.db
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 paramtune
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist/client ./dist/client
COPY --from=builder /app/dist/server ./dist/server
COPY --from=builder /app/scripts/env.mjs /app/scripts/start.mjs ./scripts/
RUN mkdir data && chown paramtune:nodejs data
USER paramtune
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://127.0.0.1:3000/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "scripts/start.mjs"]
