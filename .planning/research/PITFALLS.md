# Pitfalls Research

**Domain:** User Authentication + Audit Trail (Adding to Existing Next.js App)
**Researched:** 2026-01-31
**Confidence:** MEDIUM (BetterAuth-specific items verified via official docs; integration patterns based on community experience)

## Critical Pitfalls

### Pitfall 1: Breaking Existing Functionality with Middleware Auth Checks

**What goes wrong:** Adding authentication middleware that blocks all routes breaks existing public API endpoints and causes the app to become inaccessible during development.

**Why it happens:** The natural approach is to add a middleware file that checks auth on every request. But ParamTune has public API routes (`/api/[platform]/*`) that external systems may depend on. A blanket auth check breaks these consumers immediately.

**How to avoid:**
1. Identify all routes that should remain public BEFORE implementing auth
2. Use route-based protection rather than blanket middleware
3. Start with protecting dashboard routes only, leave API routes public initially
4. Add API auth (API keys or OAuth) as a separate phase if needed

**Warning signs:**
- 401 errors in browser console for unauthenticated users
- External integrations failing
- "Works locally" but fails in staging (different auth behavior)

**Phase to address:** Phase 1 - Foundation Setup (define public vs protected routes upfront)

---

### Pitfall 2: Cookie-Only Middleware Checks Create False Security

**What goes wrong:** Using `getSessionCookie()` in middleware to check for session existence and assuming the route is protected. Anyone can manually create a cookie with the right name to bypass this check.

**Why it happens:** BetterAuth documentation shows cookie checks for performance (avoiding DB calls in middleware). Developers mistake this for security.

**How to avoid:**
1. Use cookie checks ONLY for redirecting unauthenticated users to login
2. ALWAYS validate session in Server Components, API routes, and Server Actions
3. Never trust middleware alone for authorization decisions
4. Implement defense in depth: middleware for UX, server-side for security

**Warning signs:**
- Auth checks only exist in middleware/proxy.ts
- No session validation in individual page components
- API routes don't validate sessions before mutations

**Phase to address:** Phase 2 - BetterAuth Integration (establish pattern of server-side validation)

---

### Pitfall 3: Existing Data Without Authors Breaks Schema Save

**What goes wrong:** After adding auth, the `saveSchema()` function requires a userId/author. But existing schemas in Redis have no author. Attempting to query "who created this?" returns null/undefined, breaking UI rendering or causing TypeScript errors.

**Why it happens:** Retrofitting auth onto existing data means historical records don't have the new required fields.

**How to avoid:**
1. Design schema changes to make `author` nullable OR have a system user
2. Create a "SYSTEM" or "LEGACY" user ID for pre-auth data
3. Add migration script to backfill existing versions with system user
4. Display "Unknown" gracefully in UI for null authors

**Warning signs:**
- TypeScript errors about `author` being potentially undefined
- UI crashes when viewing historical versions
- "Cannot read property 'name' of undefined" errors

**Phase to address:** Phase 3 - Data Model Updates (handle legacy data before implementing UI)

---

### Pitfall 4: Audit Trail Stored in Mutable Redis Keys

**What goes wrong:** Audit logs stored in regular Redis keys can be modified or deleted, undermining the entire purpose of an audit trail. A compromised app or admin can rewrite history.

**Why it happens:** Redis is already the data store, so it's convenient. But ParamTune already uses ZADD for schema versions, which allows updates to the same score.

**How to avoid:**
1. Use append-only data structures (Redis Streams, not ZADD)
2. Implement hash chaining where each entry includes hash of previous entry
3. Store audit logs separately from operational data
4. Consider write-once-read-many (WORM) storage for compliance-critical apps
5. At minimum: no DELETE commands on audit keys, no TTL

**Warning signs:**
- Audit records can be updated or deleted via Redis CLI
- No cryptographic verification of audit integrity
- Same Redis keys used for operational data and audit logs

**Phase to address:** Phase 4 - Audit Trail Implementation (design immutable storage)

---

### Pitfall 5: Session Management with Next.js 16 Proxy (Formerly Middleware)

**What goes wrong:** Code works in Next.js 15 middleware but fails in Next.js 16 because `middleware.ts` is replaced by `proxy.ts`. Additionally, `use cache` directive is incompatible with `getServerSession`.

**Why it happens:** Next.js 16 changed the execution model. Edge runtime limitations still apply to proxy.ts. The `use cache` feature cannot access dynamic data sources like sessions.

**How to avoid:**
1. Use `proxy.ts` instead of `middleware.ts` for Next.js 16
2. Keep proxy logic lightweight (cookie existence check only)
3. Never call `getServerSession` inside cached functions
4. Use `headers()` outside of cached function if needed
5. Validate sessions in Server Components/Actions, not proxy

**Warning signs:**
- `middleware.ts` file exists in Next.js 16 project
- Error: "Accessing dynamic data sources inside cache scope"
- Session works on first load but not after navigation

**Phase to address:** Phase 2 - BetterAuth Integration (configure correctly for Next.js 16)

---

### Pitfall 6: Google OAuth redirect_uri_mismatch in Production

**What goes wrong:** Google OAuth works locally but fails in production with `redirect_uri_mismatch` or `invalid_scope` errors.

**Why it happens:**
- BetterAuth needs `baseURL` configured to construct callback URLs
- Google doesn't support `offline_access` scope (uses `access_type=offline` instead)
- Authorized redirect URIs in Google Console don't match production domain

**How to avoid:**
1. Set `baseURL` in BetterAuth config (use env variable for different environments)
2. Configure Google Console with ALL callback URLs (localhost, staging, production)
3. Don't use `offline_access` scope with Google
4. Test OAuth flow in staging before production deployment

**Warning signs:**
- OAuth works locally, fails in deployed environment
- Error messages mentioning `redirect_uri` or `invalid_scope`
- Missing `BETTER_AUTH_URL` or `NEXTAUTH_URL` environment variable

**Phase to address:** Phase 2 - BetterAuth Integration (environment configuration)

---

## Moderate Pitfalls

### Pitfall 7: Plugin Order in BetterAuth Configuration

**What goes wrong:** Cookies not being set automatically, session data missing.

**Why it happens:** The `nextCookies` plugin must be last in the plugins array to work correctly.

**How to avoid:**
```typescript
export const auth = betterAuth({
  plugins: [
    // Other plugins first
    adminPlugin(),
    auditLogPlugin(),
    nextCookies(), // MUST be last
  ]
})
```

**Phase to address:** Phase 2 - BetterAuth Integration

---

### Pitfall 8: Audit Log Volume Explosion

**What goes wrong:** Audit logs grow unboundedly, consuming Redis memory and slowing queries.

**Why it happens:** Every schema view, not just mutations, gets logged. Auto-save features trigger dozens of audit entries per edit session.

**How to avoid:**
1. Only log mutations (create, update, delete), not reads
2. Debounce auto-save audit entries
3. Implement log rotation or TTL for non-compliance data
4. Use Redis Streams with MAXLEN to cap size
5. Consider cold storage for old audit data

**Warning signs:**
- Redis memory usage growing rapidly
- ZRANGEBYSCORE queries becoming slow
- Hundreds of audit entries for single edit session

**Phase to address:** Phase 4 - Audit Trail Implementation

---

### Pitfall 9: Session Token in URL or localStorage

**What goes wrong:** Session tokens exposed in URLs (visible in browser history, server logs, referrer headers) or localStorage (accessible via XSS).

**Why it happens:** Developers unfamiliar with auth security store tokens incorrectly for convenience.

**How to avoid:**
1. Use httpOnly cookies exclusively (BetterAuth default)
2. Never pass session tokens as URL parameters
3. Don't store tokens in localStorage or sessionStorage
4. Enable secure flag for production cookies

**Warning signs:**
- Token visible in URL after login redirect
- localStorage contains "token" or "session" keys
- Cookie inspector shows missing httpOnly flag

**Phase to address:** Phase 2 - BetterAuth Integration

---

### Pitfall 10: Race Condition in Schema Save with Audit

**What goes wrong:** Schema saves and audit log entries become inconsistent. User sees "Save successful" but audit log is missing, or vice versa.

**Why it happens:** Schema save and audit log write are separate operations. If one fails, the other might succeed.

**How to avoid:**
1. Wrap schema save + audit write in transaction-like pattern
2. Consider making audit log a side effect of the schema write (same Redis MULTI block)
3. Log audit entry BEFORE attempting save, with status "attempted"
4. Update audit entry after save with status "completed" or "failed"

**Warning signs:**
- Audit logs missing for some saves
- Audit shows "save" but schema data is old
- Intermittent errors during save

**Phase to address:** Phase 4 - Audit Trail Implementation

---

## Minor Pitfalls

### Pitfall 11: Missing Error States in Auth UI

**What goes wrong:** Users get stuck on loading states or see blank screens when auth fails.

**Why it happens:** Happy path implemented, but OAuth errors, network issues, and edge cases not handled.

**How to avoid:**
1. Handle all OAuth callback error states
2. Show clear error messages with retry options
3. Implement loading states for auth operations
4. Handle session expiry gracefully (redirect to login, not error page)

**Phase to address:** Phase 5 - UI Integration

---

### Pitfall 12: Cookie Name Mismatch Between Config and Middleware

**What goes wrong:** Session appears valid in middleware but null in Server Components (or vice versa).

**Why it happens:** Cookie name or prefix configured differently in auth config vs middleware check.

**How to avoid:**
1. Define cookie configuration in single source of truth
2. Use BetterAuth's exported helpers consistently
3. Test auth state in both middleware and Server Components

**Phase to address:** Phase 2 - BetterAuth Integration

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip audit log for reads | Simpler implementation, less storage | Can't prove data wasn't accessed | MVP if only mutations matter |
| Nullable author on schemas | No migration needed | UI complexity for null handling | MVP with plan to backfill |
| Cookie-only middleware auth | Faster page loads | Security vulnerability if only check | Never for sensitive mutations |
| Single Redis instance for audit | No infrastructure change | Audit can be tampered | Internal tools, non-compliance |
| No hash chaining on audit | Simpler implementation | Can't detect tampering | Low-security internal tools |
| Store audit in same DB as data | Simple queries | Audit compromised if DB compromised | MVP with plan to separate |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Trusting middleware alone for auth | Bypass via crafted cookies | Always validate in Server Components |
| Storing session in localStorage | XSS can steal sessions | Use httpOnly cookies only |
| Logging sensitive data in audit | Data breach amplification | Hash or encrypt PII in audit logs |
| No CSRF protection on mutations | State-changing attacks | Use BetterAuth's built-in CSRF |
| Exposing user IDs in URLs | Enumeration attacks | Use opaque identifiers |
| Same secret for dev and prod | Compromised dev = compromised prod | Separate secrets per environment |
| Missing rate limiting on login | Brute force attacks | Enable BetterAuth rate limiting |

---

## "Looks Done But Isn't" Checklist

- [ ] **Auth middleware exists** - Often missing: server-side validation in pages/routes
- [ ] **Login works** - Often missing: logout, session expiry handling, error states
- [ ] **Google OAuth configured** - Often missing: production redirect URIs, staging environment
- [ ] **Audit logs created** - Often missing: immutability guarantees, retention policy
- [ ] **Author displayed on schema** - Often missing: handling for legacy null authors
- [ ] **Protected routes redirect** - Often missing: API route protection, server action protection
- [ ] **Session persists** - Often missing: cross-tab sync, refresh token handling

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Breaking existing functionality | Phase 1 - Foundation | Test public API still works |
| Cookie-only false security | Phase 2 - BetterAuth | Code review for server validation |
| Legacy data without authors | Phase 3 - Data Model | Query for null author count = 0 |
| Mutable audit storage | Phase 4 - Audit Trail | Attempt to modify audit, should fail |
| Next.js 16 proxy issues | Phase 2 - BetterAuth | Session works after navigation |
| Google OAuth production | Phase 2 - BetterAuth | Test OAuth in staging environment |
| Plugin order | Phase 2 - BetterAuth | Cookies set on first auth |
| Audit volume explosion | Phase 4 - Audit Trail | Load test with realistic usage |
| Session token exposure | Phase 2 - BetterAuth | Security audit of storage |
| Race condition in save | Phase 4 - Audit Trail | Concurrent save test |

---

## Sources

### BetterAuth Official Documentation
- [Next.js Integration](https://www.better-auth.com/docs/integrations/next) - Cookie handling, proxy setup, RSC limitations
- [Auth.js Migration Guide](https://www.better-auth.com/docs/guides/next-auth-migration-guide) - Schema differences, breaking changes
- [Google OAuth](https://www.better-auth.com/docs/authentication/google) - Setup requirements, scope issues
- [Session Management](https://www.better-auth.com/docs/concepts/session-management) - Redis secondary storage

### GitHub Issues (Community Experience)
- [getServerSession with use cache](https://github.com/better-auth/better-auth/issues/5584) - Next.js 16 caching incompatibility
- [invalid_scope with Google SSO](https://github.com/better-auth/better-auth/issues/3926) - offline_access not supported
- [invalid_code OAuth error](https://github.com/better-auth/better-auth/issues/3401) - Version-specific issues

### Audit Trail Best Practices
- [Guide to Building Audit Logs](https://medium.com/@tony.infisical/guide-to-building-audit-logs-for-application-software-b0083bb58604) - Immutability, querying, export
- [Immutable Audit Trails](https://www.hubifi.com/blog/immutable-audit-log-basics) - Hash chaining, WORM storage
- [Redis Audit Logging](https://moldstud.com/articles/p-comprehensive-step-by-step-approach-to-successfully-implementing-robust-audit-logging-in-redis) - Redis-specific patterns

### Next.js Authentication Patterns
- [Edge Runtime Limitations](https://medium.com/@shuhan.chan08/authentication-in-next-js-middleware-edge-runtime-limitations-solutions-7692a44f47ab) - Split config pattern
- [CVE-2025-29927](https://javascript.plainenglish.io/stop-crying-over-auth-a-senior-devs-guide-to-next-js-15-auth-js-v5-42a57bc5b4ce) - Middleware bypass vulnerability
- [Auth Solutions 2026](https://workos.com/blog/top-authentication-solutions-nextjs-2026) - Current landscape

### Database Migration Patterns
- [Foreign Key Migration](https://docs.gitlab.com/ee/development/database/add_foreign_key_to_existing_column.html) - Multi-step approach for existing data
