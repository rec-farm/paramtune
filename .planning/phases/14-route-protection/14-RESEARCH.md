# Phase 14: Route Protection - Research

**Researched:** 2026-01-31
**Domain:** Next.js App Router Route Protection with BetterAuth
**Confidence:** HIGH

## Summary

Phase 14 requires protecting `/dashboard/*` routes so unauthenticated users are redirected to login, with automatic return to their intended destination after authentication. Additionally, authenticated users should see their Google name and avatar in the header with a user menu providing logout.

BetterAuth provides two main approaches for route protection in Next.js: (1) Server Component session validation with `auth.api.getSession()` for actual security checks, and (2) middleware/proxy for UX optimizations like early redirects. The project already uses the nextCookies plugin and has auth infrastructure in place from Phase 13.

The key insight from BetterAuth documentation is: **"Better Auth recommends handling auth checks on each page or route rather than in a Proxy or Layout."** This aligns with the project's defense-in-depth strategy from STATE.md.

**Primary recommendation:** Use Server Component session validation in dashboard layout for security; add middleware for early redirect UX optimization. Use `signIn.social({ callbackURL })` for return-after-login.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-auth | 1.4.x | Auth framework | Already installed, provides getSession |
| next/headers | 16.x | Server Component headers access | Required for getSession in RSC |
| next/navigation | 16.x | Redirect and navigation | Server Component redirects |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.555.0 | Icons (User, LogOut, ChevronDown) | Avatar fallback, menu icons |

### Not Needed (Existing in Project)
| Already Have | Usage |
|--------------|-------|
| signIn, signOut, useSession | From src/lib/auth-client.ts |
| nextCookies plugin | Already configured in src/lib/auth.ts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled dropdown | Radix UI DropdownMenu | Simpler for single menu, can add Radix later if needed |
| Middleware-only auth | Server Component validation | Middleware is UX; Server Components are security |

**No installation needed** - all dependencies already in place.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   └── auth.ts             # Existing - add getSession helper
│   └── auth-client.ts      # Existing - no changes needed
├── app/
│   └── dashboard/
│       └── layout.tsx      # Add session validation with redirect
│   └── login/
│       └── page.tsx        # Add callbackURL support
├── components/
│   └── UserMenu.tsx        # NEW: Avatar + dropdown menu
│   └── AuthNav.tsx         # MODIFY: Replace button with UserMenu
│   └── MobileAuthNav.tsx   # MODIFY: Add avatar display
└── middleware.ts           # MODIFY: Add dashboard route protection
```

### Pattern 1: Server Component Session Validation
**What:** Validate session in Server Components using `auth.api.getSession()`
**When to use:** Dashboard layout, any protected page
**Example:**
```typescript
// Source: https://www.better-auth.com/docs/integrations/next
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect("/login")
  }

  return <>{children}</>
}
```

### Pattern 2: Login with Return URL
**What:** Pass intended destination via callbackURL parameter to signIn.social()
**When to use:** Login page when user was redirected from protected route
**Example:**
```typescript
// Source: https://www.better-auth.com/docs/basic-usage
// Login page reads intended destination from URL params
const searchParams = useSearchParams()
const returnTo = searchParams.get('returnTo') || '/dashboard'

// Pass to signIn
signIn.social({
  provider: 'google',
  callbackURL: returnTo
})
```

### Pattern 3: Middleware for UX Redirects
**What:** Early redirect unauthenticated users before page renders
**When to use:** Dashboard routes for faster UX (but NOT as sole security)
**Example:**
```typescript
// Source: https://www.better-auth.com/docs/integrations/next
import { getSessionCookie } from "better-auth/cookies"

export function middleware(request: NextRequest) {
  // Cookie check only - NOT security, just UX optimization
  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie && request.nextUrl.pathname.startsWith('/dashboard')) {
    const returnTo = encodeURIComponent(request.nextUrl.pathname)
    return NextResponse.redirect(new URL(`/login?returnTo=${returnTo}`, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*']
}
```

### Pattern 4: User Avatar with Fallback
**What:** Display user's Google avatar with text fallback
**When to use:** Header user menu, any user display
**Example:**
```typescript
// User initial fallback when image fails
function UserAvatar({ user }: { user: { name?: string; image?: string } }) {
  const initial = user.name?.charAt(0).toUpperCase() || '?'

  return user.image ? (
    <img src={user.image} alt="" className="h-8 w-8 rounded-full" />
  ) : (
    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
      <span className="text-sm font-medium">{initial}</span>
    </div>
  )
}
```

### Anti-Patterns to Avoid
- **Cookie-only auth:** Using `getSessionCookie()` as the only auth check - it only verifies cookie existence, not validity. Anyone can manually create a cookie.
- **Layout-only validation without page checks:** Layouts can be cached; always validate in the page or route handler too for critical operations.
- **Hardcoded redirects:** Always preserve the user's intended destination with returnTo/callbackURL.
- **Blocking signIn with static URLs:** Use searchParams to get dynamic returnTo, not hardcoded "/dashboard".

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session validation | Custom cookie parsing | `auth.api.getSession()` | Handles expiry, refresh, validation |
| OAuth state | URL param passing manually | `callbackURL` option in signIn.social | BetterAuth manages OAuth state internally |
| Cookie reading | document.cookie parsing | `getSessionCookie()` from better-auth/cookies | Handles cookie prefixes, names |
| Dropdown menu | Custom useState + click-outside | CSS-only dropdown or Radix (later) | Accessibility, keyboard nav are complex |

**Key insight:** BetterAuth handles OAuth state management internally. The `callbackURL` passed to `signIn.social()` is stored in OAuth state and automatically used after provider callback.

## Common Pitfalls

### Pitfall 1: Async headers() in Next.js 16
**What goes wrong:** `headers()` is now async in Next.js 16, code using `headers()` synchronously will fail
**Why it happens:** Next.js 16 changed headers() to be async
**How to avoid:** Always `await headers()` before passing to getSession
**Warning signs:** Type errors about headers not being HeadersInit

### Pitfall 2: Router Cache After Login
**What goes wrong:** After login, navigating to protected routes may show stale (unauthorized) cached state
**Why it happens:** Next.js App Router caches routes by default
**How to avoid:** Call `router.refresh()` after successful login to clear cache
**Warning signs:** User logs in but dashboard still redirects to login

### Pitfall 3: Cookie-Only Middleware "Security"
**What goes wrong:** Treating middleware cookie check as security instead of UX optimization
**Why it happens:** Middleware runs before page, feels like security
**How to avoid:** Always validate in Server Component. Middleware is for fast redirects, not access control.
**Warning signs:** Security review asks "what if someone forges the cookie?"

### Pitfall 4: Missing callbackURL Encoding
**What goes wrong:** returnTo URL with special characters breaks redirect
**Why it happens:** URL parameters need encoding
**How to avoid:** Use `encodeURIComponent()` for returnTo param
**Warning signs:** Redirects fail for routes like `/dashboard/platform/1.0.0`

### Pitfall 5: Dynamic Import SSR Issues (From Phase 13)
**What goes wrong:** Components using useSession cause hydration errors
**Why it happens:** useSession creates React context during static generation
**How to avoid:** Use `dynamic(() => import(...), { ssr: false })` for auth-aware client components
**Warning signs:** "Text content does not match" errors, React hydration warnings

## Code Examples

Verified patterns from official sources:

### Get Session in Server Component
```typescript
// Source: https://www.better-auth.com/docs/integrations/next
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: await headers()
  })

  if (!session) {
    redirect("/login")
  }

  // session.user.name, session.user.email, session.user.image available
  return <div>Welcome {session.user.name}</div>
}
```

### SignIn with CallbackURL
```typescript
// Source: https://www.better-auth.com/docs/basic-usage
await signIn.social({
  provider: 'google',
  callbackURL: '/dashboard',        // Redirect after auth
  errorCallbackURL: '/login?error=true',  // On error
  newUserCallbackURL: '/dashboard'  // For new users (optional)
})
```

### Simple CSS-Only Dropdown Menu
```typescript
// Existing project pattern - CSS-only dropdown (no Radix needed for simple menu)
// Use focus-within for keyboard accessibility
function UserMenu({ user }: { user: User }) {
  return (
    <div className="relative group">
      <button className="flex items-center gap-2">
        <img src={user.image} className="h-8 w-8 rounded-full" />
        <ChevronDown className="h-4 w-4" />
      </button>
      <div className="absolute right-0 mt-2 w-48 opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all">
        {/* Menu items */}
      </div>
    </div>
  )
}
```

### Middleware Cookie Check
```typescript
// Source: https://www.better-auth.com/docs/integrations/next
import { getSessionCookie } from "better-auth/cookies"
import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie && request.nextUrl.pathname.startsWith('/dashboard')) {
    const returnTo = encodeURIComponent(request.nextUrl.pathname + request.nextUrl.search)
    return NextResponse.redirect(new URL(`/login?returnTo=${returnTo}`, request.url))
  }

  return NextResponse.next()
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Middleware-only auth | Server Component validation + middleware UX | 2025 | Security is in RSC, middleware is optimization |
| synchronous headers() | async headers() | Next.js 16 | Must await headers() |
| middleware.ts | proxy.ts (Next.js 16) | Dec 2025 | Filename change, same functionality |

**Deprecated/outdated:**
- **Relying on middleware for security:** Now recommended only for UX redirects
- **synchronous headers():** Will error in Next.js 16+

**Note on Next.js 16 proxy.ts:** While Next.js 16 renames middleware.ts to proxy.ts, the project is currently using middleware.ts with Next.js 16.0.10. The existing middleware works. BetterAuth docs confirm full Next.js 16 compatibility.

## Open Questions

Things that couldn't be fully resolved:

1. **router.refresh() After Login**
   - What we know: BetterAuth docs recommend calling router.refresh() after login to clear router cache
   - What's unclear: Best placement - in login page success handler or in redirect target page
   - Recommendation: Add to login page after successful signIn callback, before navigation

2. **Mobile User Menu Design**
   - What we know: Desktop gets dropdown, mobile needs different UX
   - What's unclear: Should mobile show full dropdown or just avatar + logout icon?
   - Recommendation: Start with avatar + logout icon for mobile (Phase 13 pattern), can add menu later

## Sources

### Primary (HIGH confidence)
- [Better Auth Next.js Integration](https://www.better-auth.com/docs/integrations/next) - middleware patterns, getSession usage, cache considerations
- [Better Auth Basic Usage](https://www.better-auth.com/docs/basic-usage) - callbackURL, errorCallbackURL, newUserCallbackURL options
- [Better Auth Session Management](https://www.better-auth.com/docs/concepts/session-management) - session object structure, cookie caching

### Secondary (MEDIUM confidence)
- Existing project code (src/lib/auth.ts, src/lib/auth-client.ts) - verified working patterns
- Phase 13 PLAN files - dynamic import pattern for auth components

### Tertiary (LOW confidence)
- WebSearch results for Next.js 16 proxy.ts rename - not critical since middleware.ts still works

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - BetterAuth docs verified, dependencies already installed
- Architecture: HIGH - BetterAuth official patterns + project conventions from Phase 13
- Pitfalls: HIGH - Official docs explicitly warn about cookie-only security, async headers documented

**Research date:** 2026-01-31
**Valid until:** 2026-03-01 (30 days - stable auth patterns)
