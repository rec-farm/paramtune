# Stack Research

**Domain:** User Authentication + Audit Trail
**Researched:** 2026-01-31
**Confidence:** HIGH

## Executive Summary

BetterAuth v1.4.x is the recommended authentication framework for this milestone. It is fully compatible with Next.js 16, provides built-in Google OAuth support, and can use Redis as secondary storage for sessions (complementing the existing ioredis setup). However, BetterAuth requires a SQL database for its core tables (user, session, account, verification) - Redis alone is not sufficient.

For the SQL requirement, better-sqlite3 with a local SQLite file is the simplest addition that minimizes infrastructure complexity while meeting BetterAuth's needs. The audit trail can be stored in Redis alongside existing schema history, with author metadata added to each schema change.

## Recommended Stack

### Core Authentication
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| better-auth | ^1.4.18 | Authentication framework | Latest stable. Fully compatible with Next.js 16 (middleware renamed to "proxy"). Built-in Google OAuth, session management, cookie handling via nextCookies plugin. TypeScript-first. |
| better-sqlite3 | ^11.x | SQL database for auth tables | BetterAuth requires SQL database for user/session/account tables. SQLite via better-sqlite3 is zero-infrastructure, serverless, single-file. Simplest path that doesn't add cloud services. |

### Session Storage (Uses Existing Redis)
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| ioredis | ^5.8.2 (existing) | Secondary session storage | Already installed. BetterAuth supports Redis as "secondary storage" for fast session lookups. Reuses existing connection. |

### OAuth Configuration
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Google OAuth (via BetterAuth) | N/A | SSO provider | BetterAuth has built-in Google OAuth support. No additional packages needed. Configure via `socialProviders.google` with clientId/clientSecret. |

## Integration Architecture

### Authentication Flow
```
User -> Next.js -> /api/auth/[...all] (BetterAuth handler)
                         |
                         v
                +--------+--------+
                |                 |
           SQLite DB         Redis (secondary)
        (user, account,     (session cache,
         verification)       rate limiting)
```

### Audit Trail Strategy
```
Schema Change Request
         |
         v
    Get Session (BetterAuth)
         |
         v
    Extract User ID
         |
         v
    Save Schema with Author Metadata
         |
         v
    Redis ZADD (existing pattern, enhanced with author)
```

## Configuration Examples

### BetterAuth Server Setup (`lib/auth.ts`)
```typescript
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import Database from "better-sqlite3";
import redis from "@/connections/redis";

export const auth = betterAuth({
  // SQL database for core auth tables
  database: new Database("./data/auth.sqlite"),

  // Google OAuth
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Always get refresh token
      accessType: "offline",
      prompt: "select_account consent",
    },
  },

  // Use existing Redis for session caching
  secondaryStorage: {
    get: async (key) => await redis.get(key),
    set: async (key, value, ttl) => {
      if (ttl) {
        await redis.set(key, value, "EX", ttl);
      } else {
        await redis.set(key, value);
      }
    },
    delete: async (key) => await redis.del(key),
  },

  // Session configuration
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Required for Next.js server actions
  plugins: [nextCookies()],

  // Production URL for OAuth callbacks
  baseURL: process.env.BETTER_AUTH_URL,
});
```

### BetterAuth Client Setup (`lib/auth-client.ts`)
```typescript
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});
```

### API Route Handler (`app/api/auth/[...all]/route.ts`)
```typescript
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
```

### Enhanced Schema Type with Author
```typescript
export type Schema = {
  content: Record<string, unknown>;
  dependencies: string[];
  output: Record<string, unknown>;
  // New audit fields
  author?: {
    id: string;
    email: string;
    name?: string;
  };
  modifiedAt?: number; // timestamp (existing pattern)
};
```

## Environment Variables

```bash
# Google OAuth (Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# BetterAuth
BETTER_AUTH_URL=http://localhost:3000  # Production: https://your-domain.com
BETTER_AUTH_SECRET=your-32-char-random-secret  # Generate with: openssl rand -base64 32

# Existing Redis (unchanged)
REDIS_URL=redis://localhost:6379
```

## Installation

```bash
# Core authentication (2 packages)
pnpm add better-auth better-sqlite3

# TypeScript types for better-sqlite3
pnpm add -D @types/better-sqlite3
```

## Database Migration

BetterAuth CLI creates required tables:

```bash
# Generate migration (review before applying)
npx better-auth migrate --generate

# Apply migration
npx better-auth migrate
```

Creates tables: `user`, `session`, `account`, `verification`

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| better-auth | NextAuth.js (Auth.js) | Legacy projects already using NextAuth. BetterAuth has cleaner API, better TypeScript support, designed for modern Next.js. |
| better-auth | Lucia Auth | If you want lower-level control. Lucia is more manual. BetterAuth provides more out-of-box features. |
| better-sqlite3 | Turso/libSQL | If you need edge deployment, distributed reads, or multi-region. Adds cloud dependency but better scaling. |
| better-sqlite3 | PostgreSQL | If you already have Postgres infrastructure or need advanced queries. Overkill for auth-only tables. |
| Redis secondary storage | Database-only sessions | If you want simpler setup at cost of performance. Redis secondary storage is recommended for faster session lookups. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Custom JWT implementation | Security-critical, easy to get wrong. BetterAuth handles session tokens correctly. | BetterAuth built-in sessions |
| Storing passwords in Redis | Redis is not designed for sensitive credential storage. BetterAuth uses SQL with proper hashing. | SQLite via BetterAuth |
| NextAuth.js v4 | Outdated, superseded by Auth.js v5 which has different API. BetterAuth is cleaner migration path. | better-auth |
| Separate audit logging service | Overkill for schema-change tracking. The existing Redis versioning pattern (ZADD with timestamp) is sufficient. | Enhanced Schema type with author field |
| @better-auth/passkey | Not needed for Google SSO only. Adds complexity. Can add later if passkey support is desired. | Basic social auth |

## Audit Trail Implementation Notes

The existing `saveSchema` function in `src/models/Schema.ts` already stores schema history using Redis sorted sets with timestamps. To add audit trail:

1. **Extract user from session** in server action before calling `saveSchema`
2. **Extend Schema type** with `author` field (user id, email, optional name)
3. **Include author in JSON payload** stored via `redis.zadd()`
4. **Display author in history UI** - already supports timestamp display, add author

This approach:
- Reuses existing Redis infrastructure
- Maintains append-only audit log (sorted set entries are immutable)
- Requires minimal code changes
- Author data is denormalized (stored with each change) for query efficiency

## Google OAuth Callback URLs

Configure in Google Cloud Console:

**Development:**
- `http://localhost:3000/api/auth/callback/google`

**Production:**
- `https://your-domain.com/api/auth/callback/google`

## Sources

- [BetterAuth Next.js Integration](https://www.better-auth.com/docs/integrations/next) - Next.js 16 compatibility confirmed
- [BetterAuth Google OAuth](https://www.better-auth.com/docs/authentication/google) - Configuration options
- [BetterAuth Session Management](https://www.better-auth.com/docs/concepts/session-management) - Redis secondary storage
- [BetterAuth Database Concepts](https://www.better-auth.com/docs/concepts/database) - SQL requirement confirmed
- [BetterAuth SQLite Adapter](https://www.better-auth.com/docs/adapters/sqlite) - better-sqlite3 setup
- [BetterAuth v1.4.18 Release](https://github.com/better-auth/better-auth/releases) - Latest stable version
- [npm: better-auth](https://www.npmjs.com/package/better-auth) - Version 1.4.15+ confirmed active
