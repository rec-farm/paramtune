# Architecture Research

**Domain:** User Authentication + Audit Trail
**Researched:** 2026-01-31
**Confidence:** HIGH

## System Overview

```
                            EXISTING SYSTEM
    +------------------------------------------------------------------+
    |                                                                  |
    |   Browser                                                        |
    |      |                                                           |
    |      v                                                           |
    |   +-------------------+     +------------------+                  |
    |   | middleware.ts     |---->| /api/* routes    |                  |
    |   | (CORS only now)   |     | (REST endpoints) |                  |
    |   +-------------------+     +------------------+                  |
    |      |                              |                            |
    |      v                              v                            |
    |   +-------------------+     +------------------+                  |
    |   | Dashboard Layout  |     | Models           |                  |
    |   | (getPlatforms)    |     | Platform.ts      |                  |
    |   +-------------------+     | Schema.ts        |                  |
    |      |                      +------------------+                  |
    |      v                              |                            |
    |   +-------------------+             |                            |
    |   | Page Components   |             |                            |
    |   | [platform]/[ver]  |             |                            |
    |   +-------------------+             |                            |
    |      |                              |                            |
    |      | Server Actions               |                            |
    |      | (updateSchema)               |                            |
    |      |                              |                            |
    |      v                              v                            |
    |   +----------------------------------------------------------+   |
    |   |                     REDIS (ioredis)                      |   |
    |   |  platforms:{id}    schemas:{p}:{v}    schemas:dependents |   |
    |   +----------------------------------------------------------+   |
    +------------------------------------------------------------------+

                         WITH AUTH + AUDIT INTEGRATION
    +------------------------------------------------------------------+
    |                                                                  |
    |   Browser                                                        |
    |      |                                                           |
    |      v                                                           |
    |   +-------------------+                                          |
    |   | middleware.ts     |<--- Session cookie check (lightweight)   |
    |   | + auth redirect   |     Redirect unauthenticated to /login   |
    |   +-------------------+                                          |
    |      |                                                           |
    |      +--------+----------------+                                 |
    |      |        |                |                                 |
    |      v        v                v                                 |
    | +---------+ +---------------+ +-------------------+              |
    | |NEW      | | /api/auth/    | | /dashboard/*      |              |
    | |/login   | | [...all]      | | (protected)       |              |
    | |page     | | BetterAuth    | +-------------------+              |
    | +---------+ | handler       |        |                           |
    |      |      +---------------+        v                           |
    |      |             |          +-------------------+              |
    |      |             |          | auth.api          |              |
    |      +-------------+          | .getSession()     |              |
    |             |                 | in Server Comps   |              |
    |             v                 +-------------------+              |
    |   +-------------------+              |                           |
    |   | lib/auth.ts       |              | userId passed             |
    |   | BetterAuth config |              | to Server Actions         |
    |   | + nextCookies()   |              v                           |
    |   +-------------------+       +-------------------+              |
    |             |                 | updateSchema()    |              |
    |             |                 | + authorId param  |              |
    |             v                 +-------------------+              |
    |   +----------------------------------------------------------+   |
    |   |                     REDIS (ioredis)                      |   |
    |   |                                                          |   |
    |   | EXISTING:                  NEW:                          |   |
    |   | platforms:{id}             betterauth:sessions:{token}   |   |
    |   | schemas:{p}:{v}            betterauth:users:{id}         |   |
    |   | schemas:dependents:{p}:{v} betterauth:accounts:{id}      |   |
    |   |                                                          |   |
    |   | MODIFIED (adds author):                                  |   |
    |   | schemas:{p}:{v} -> { content, dependencies, output,      |   |
    |   |                      authorId, authorEmail, authorName } |   |
    |   +----------------------------------------------------------+   |
    +------------------------------------------------------------------+
```

## Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `lib/auth.ts` | BetterAuth server instance with Redis secondary storage, Google OAuth config | Create once, export singleton |
| `lib/auth-client.ts` | BetterAuth client for signIn/signOut, session hooks | React hooks for client components |
| `/api/auth/[...all]/route.ts` | Catch-all route for BetterAuth HTTP handlers | Export GET, POST from toNextJsHandler |
| `middleware.ts` | Lightweight session cookie check, redirect to /login | Check cookie existence only, no DB calls |
| `/login/page.tsx` | Login UI with Google OAuth button | Client component with authClient.signIn.social |
| `getSessionOrRedirect()` | DAL helper to get session in server components | Memoized with React.cache() |
| Modified Server Actions | Accept authorId, attach to schema saves | Pass session.user to saveSchema |

## Integration Points

### With Existing Components

**1. Middleware (`src/middleware.ts`)**

Current: Only handles CORS for /api/* routes.

Modified: Add session cookie check for /dashboard/* routes.

```typescript
// middleware.ts (modified)
import { getSessionCookie } from "better-auth/next-js";

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Existing CORS handling for /api/*
  if (pathname.startsWith('/api/')) {
    // ... existing CORS logic unchanged ...
  }

  // NEW: Auth check for /dashboard/*
  if (pathname.startsWith('/dashboard')) {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}
```

**Why lightweight check:** Middleware runs on every request. Calling auth.api.getSession() would add latency and database load. Cookie existence is sufficient for redirect; full validation happens in Server Components.

**2. Dashboard Layout (`src/app/dashboard/layout.tsx`)**

Current: Fetches platforms, renders Sidebar.

Modified: Also fetch session and pass user info to Sidebar for display.

```typescript
// dashboard/layout.tsx (modified)
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function DashboardLayout({ children }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // If middleware let us through but session is invalid, redirect
  if (!session) {
    redirect('/login');
  }

  const platforms = await getPlatforms();

  return (
    <SidebarProvider>
      <MobileHeader user={session.user} />
      <div className="flex min-h-screen">
        <Sidebar platforms={platforms} user={session.user} />
        <main>{children}</main>
      </div>
    </SidebarProvider>
  );
}
```

**3. Server Actions (`src/app/dashboard/[platform]/[version]/page.tsx`)**

Current: updateSchema() calls saveSchema() without author info.

Modified: Pass session.user.id to saveSchema().

```typescript
// page.tsx (modified)
async function updateSchema(formData: FormData) {
  'use server';

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) throw new Error('Unauthorized');

  const content = JSON.parse(formData.get('content') as string);

  await saveSchema(platformName, versionName, content, {
    authorId: session.user.id,
    authorEmail: session.user.email,
    authorName: session.user.name,
  });

  revalidatePath('/dashboard/[platform]/[version]', 'page');
}
```

**4. Schema Model (`src/models/Schema.ts`)**

Current: saveSchema() stores { content, dependencies, output }.

Modified: Also store author metadata.

```typescript
// Schema.ts (modified type)
export type Schema = {
  content: Record<string, unknown>;
  dependencies: string[];
  output: Record<string, unknown>;
  // NEW
  authorId?: string;
  authorEmail?: string;
  authorName?: string;
};

// saveSchema signature change
export async function saveSchema(
  platform: string,
  version: string,
  content: Record<string, unknown>,
  author?: { authorId: string; authorEmail: string; authorName?: string }
) {
  // ... existing logic ...

  await redis.zadd(
    getKey(platform, version),
    Date.now(),
    JSON.stringify({
      dependencies,
      content,
      output,
      // NEW
      authorId: author?.authorId,
      authorEmail: author?.authorEmail,
      authorName: author?.authorName,
    })
  );
}
```

### New Components Needed

| Component | Purpose | Location |
|-----------|---------|----------|
| `lib/auth.ts` | BetterAuth server configuration | `/src/lib/auth.ts` |
| `lib/auth-client.ts` | BetterAuth client hooks | `/src/lib/auth-client.ts` |
| `/api/auth/[...all]/route.ts` | BetterAuth route handler | `/src/app/api/auth/[...all]/route.ts` |
| `/login/page.tsx` | Login page with Google OAuth | `/src/app/login/page.tsx` |
| `UserMenu` component | User avatar/dropdown in sidebar | `/src/components/UserMenu.tsx` |

## Data Flow

### Authentication Flow

```
1. User visits /dashboard
       |
       v
2. middleware.ts checks for session cookie
       |
       +--[no cookie]--> Redirect to /login
       |
       v
3. dashboard/layout.tsx calls auth.api.getSession()
       |
       +--[invalid session]--> Redirect to /login
       |
       v
4. Session valid, render dashboard with user context
       |
       v
5. User avatar shown in sidebar via props

---

SIGN IN FLOW:

1. User on /login page clicks "Sign in with Google"
       |
       v
2. authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })
       |
       v
3. Redirect to Google OAuth consent screen
       |
       v
4. Google redirects to /api/auth/callback/google
       |
       v
5. BetterAuth handler creates/finds user, creates session
       |
       v
6. Session cookie set, redirect to /dashboard (callbackURL)
```

### Audit Trail Flow

```
1. User edits schema in JsonEditable component
       |
       v
2. Form submission triggers updateSchema server action
       |
       v
3. Server action:
   a. Gets session via auth.api.getSession()
   b. Extracts user info (id, email, name)
   c. Passes to saveSchema() as author parameter
       |
       v
4. saveSchema() in Schema.ts:
   a. All existing logic (dependency resolution, cascade, etc.)
   b. Includes authorId, authorEmail, authorName in stored JSON
       |
       v
5. Redis ZADD: schemas:{platform}:{version} with timestamp score
   Value: { content, dependencies, output, authorId, authorEmail, authorName }
       |
       v
6. SchemaHistory component displays:
   - Timestamp (existing)
   - Author name/email (NEW)
   - Content diff (existing)
```

**Key insight:** Author info is embedded in each schema version record. Since Redis sorted sets store each version with timestamp, the audit trail is already built into the existing version history mechanism. No separate audit log needed.

## Redis Schema Updates

### Existing Keys (unchanged)

```
platforms:{id}                    # Sorted set of platform JSON
schemas:{platform}:{version}      # Sorted set of schema versions
schemas:dependents:{p}:{v}        # Set of dependent schema IDs
```

### New Keys (BetterAuth)

BetterAuth with Redis secondary storage creates these keys:

```
# Sessions (secondary storage)
ba:session:{sessionToken}         # Session data JSON with TTL

# Users (if storeSessionInDatabase: true is NOT set)
# Note: With secondary storage only, users are stored in Redis
ba:user:{userId}                  # User data JSON
ba:account:{providerId}:{providerAccountId}  # OAuth account link
```

**Recommendation:** Use `storeSessionInDatabase: false` (default with secondaryStorage) to keep all auth data in Redis, maintaining the Redis-only constraint.

### Modified Schema Structure

Before:
```json
{
  "content": { ... },
  "dependencies": ["base/1.0.0"],
  "output": { ... }
}
```

After:
```json
{
  "content": { ... },
  "dependencies": ["base/1.0.0"],
  "output": { ... },
  "authorId": "abc123",
  "authorEmail": "user@example.com",
  "authorName": "Jane Doe"
}
```

**Backward compatibility:** Old records without author fields will display "Unknown" in the UI. Type uses optional fields (`authorId?: string`).

## Patterns to Follow

### Pattern 1: Data Access Layer (DAL) for Auth

**What:** Centralize session verification in a single helper function.

**Why:** Avoids repeating session fetch logic, ensures consistent auth checks, enables memoization.

```typescript
// src/lib/dal.ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

export const getSessionOrRedirect = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  return session;
});
```

Usage in Server Components and Server Actions:
```typescript
const session = await getSessionOrRedirect();
// session is guaranteed to exist at this point
```

### Pattern 2: Author Attribution in Server Actions

**What:** Always pass author context from session to data mutations.

**Why:** Server Actions can be called from anywhere; auth check must happen at the action level.

```typescript
// In page.tsx server action
async function updateSchema(formData: FormData) {
  'use server';

  const session = await getSessionOrRedirect();

  await saveSchema(platform, version, content, {
    authorId: session.user.id,
    authorEmail: session.user.email,
    authorName: session.user.name,
  });
}
```

### Pattern 3: Lightweight Middleware Checks

**What:** Check cookie existence in middleware, validate session in components.

**Why:** Middleware runs on every request; database calls add latency. Full validation in Server Components is sufficient.

```typescript
// middleware.ts - lightweight
if (pathname.startsWith('/dashboard')) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// dashboard/layout.tsx - full validation
const session = await auth.api.getSession({ headers: await headers() });
if (!session) redirect('/login');
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Relying on Middleware Alone

**What:** Trusting middleware to be the only auth check.

**Why bad:** CVE-2025-29927 demonstrated middleware can be bypassed. Server Actions are callable from any route.

**Instead:** Verify auth at every data access point (DAL pattern).

### Anti-Pattern 2: Passing Session via Props

**What:** Fetching session in layout, passing down through component tree.

**Why bad:** Server Actions don't receive props. Deep prop drilling is fragile.

**Instead:** Call `getSessionOrRedirect()` where needed; React.cache() prevents duplicate fetches.

### Anti-Pattern 3: Storing Full User Object in Schema

**What:** Embedding entire user JSON in each schema version.

**Why bad:** Bloats Redis storage, user info may change (name updates).

**Instead:** Store only userId, email, name. UI can fetch fresh user info if needed.

### Anti-Pattern 4: Separate Audit Log Table

**What:** Creating a separate audit_log structure alongside schema versions.

**Why bad:** Duplicates data, adds complexity, version history already has timestamps.

**Instead:** Embed author metadata in existing schema version records.

## Build Order

Suggested implementation sequence based on dependencies:

### Phase 1: Core Auth Infrastructure

1. **Install better-auth** package
2. **Create `/src/lib/auth.ts`** - BetterAuth configuration with:
   - Existing Redis connection as secondary storage
   - Google OAuth provider configuration
   - nextCookies() plugin for cookie handling
3. **Create `/src/lib/auth-client.ts`** - Client hooks
4. **Create `/src/app/api/auth/[...all]/route.ts`** - Route handler
5. **Create `/src/app/login/page.tsx`** - Basic login page with Google button

**Verification:** Can sign in with Google, session cookie is set.

### Phase 2: Route Protection

6. **Modify `/src/middleware.ts`** - Add session cookie check for /dashboard/*
7. **Create `/src/lib/dal.ts`** - getSessionOrRedirect() helper
8. **Modify `/src/app/dashboard/layout.tsx`** - Verify session, pass user to sidebar

**Verification:** Unauthenticated users redirected to /login, authenticated users see dashboard.

### Phase 3: Author Attribution

9. **Modify `Schema.ts` types** - Add optional author fields
10. **Modify `saveSchema()` function** - Accept and store author parameter
11. **Modify `updateSchema` server action** - Get session, pass author to saveSchema()
12. **Modify `getSchemaHistoryWithTimestamps` return type** - Include author fields

**Verification:** New schema saves include author info in Redis.

### Phase 4: UI Integration

13. **Create `UserMenu` component** - Avatar, name, sign out button
14. **Modify `Sidebar`** - Display UserMenu with session.user
15. **Modify `SchemaHistory` component** - Display author name/email for each version
16. **Add sign out functionality** - authClient.signOut() + redirect

**Verification:** Full flow works end-to-end with author shown in history.

## Environment Variables Required

```bash
# BetterAuth
BETTER_AUTH_SECRET=<32+ character random string>
BETTER_AUTH_URL=http://localhost:3000  # Production: https://yourdomain.com

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>

# Existing
REDIS_URL=redis://localhost:6379
```

## Sources

- [BetterAuth Next.js Integration](https://www.better-auth.com/docs/integrations/next) - HIGH confidence (official docs)
- [BetterAuth Session Management](https://www.better-auth.com/docs/concepts/session-management) - HIGH confidence (official docs)
- [BetterAuth Google Provider](https://www.better-auth.com/docs/authentication/google) - HIGH confidence (official docs)
- [BetterAuth Database Concepts](https://www.better-auth.com/docs/concepts/database) - HIGH confidence (official docs)
- [Next.js Authentication Guide](https://nextjs.org/docs/app/guides/authentication) - HIGH confidence (official docs)
- [Auth.js Protecting Routes](https://authjs.dev/getting-started/session-management/protecting) - MEDIUM confidence (similar patterns)
- [CVE-2025-29927 Analysis](https://nextjs.org/docs/app/guides/authentication) - HIGH confidence (Next.js official)

---

*Architecture research for ParamTune v1.3 User System & Audit Trail milestone*
