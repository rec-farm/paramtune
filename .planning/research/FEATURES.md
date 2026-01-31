# Feature Research: User Authentication + Audit Trail

**Domain:** User Authentication + Audit Trail for Schema Management Tool
**Researched:** 2026-01-31
**Confidence:** HIGH

## Executive Summary

Authentication and audit trail features for schema management tools follow well-established patterns from the broader developer tooling ecosystem. Users expect frictionless SSO login, persistent sessions, and clear attribution on changes. The key differentiator is not the authentication itself but how well audit information integrates with version history - making "who changed what and when" instantly visible without disrupting editing workflows.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that users assume exist. Missing any = product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Google SSO login** | Industry standard for developer tools. Manual account creation = friction | Low | BetterAuth handles OAuth flow. Single provider for v1.3 is fine |
| **Persistent sessions** | Users expect to stay logged in across browser sessions | Low | BetterAuth's `rememberMe` defaults to true. Cookie-based persistence |
| **User avatar/name display** | Confirms who is logged in. Standard header pattern | Low | Google provides name + profile image via OAuth |
| **Logout functionality** | Security expectation. Must be discoverable in header | Low | Single click, immediate session invalidation |
| **Author name on schema versions** | Core audit need. "Who created this version?" | Low | Store user ID with version metadata in Redis |
| **Timestamp on changes** | When did this change happen? Required for audit | Low | Already have `createdAt` in version data |
| **Version history list** | See all versions chronologically with author attribution | Medium | Extend existing version history UI with author column |
| **Change comparison** | What changed between versions? | Already Built | Schema diff exists at /dashboard/compare |
| **Protected routes** | Unauthenticated users cannot access dashboard | Low | Middleware redirect to login |
| **Login redirect flow** | After login, return to intended destination | Low | Store redirect URL in session/cookie |

### Differentiators (Competitive Advantage)

Features that elevate the product above competitors. Not expected, but valued when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Inline author badges** | Show author avatar next to version in history without leaving page | Low | Small UX win, reduces cognitive load |
| **Version restore capability** | One-click restore to previous version (with current user as author) | Medium | Creates new version, doesn't overwrite. Clear audit trail |
| **Activity feed** | Recent changes across all platforms in one view | Medium | Dashboard widget showing "X changed platform Y 2h ago" |
| **Change annotations** | Optional commit message when saving schema | Medium | "Why" not just "what" - valuable for team context |
| **Author filtering** | Filter version history by author | Low | Simple dropdown filter on existing history UI |
| **Session listing** | See active sessions, revoke from other devices | Medium | BetterAuth supports session management |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem valuable but typically cause more problems than they solve - especially for v1.3.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Role-based permissions** | "We need admin vs editor vs viewer" | Massive complexity for small teams. Permission matrices become maintenance nightmare. Most schema tools function fine with equal access | Defer to v2+. All authenticated users equal for now. PROJECT.md explicitly lists this as Future |
| **Email/password auth** | "Some users don't have Google" | Password management is security liability. Password reset flows. Account recovery complexity | Stick with Google SSO. Add GitHub later if needed |
| **Detailed action logging** | "Log every click, every view" | Storage balloons quickly. Privacy concerns. Data becomes noise. Teams don't actually review granular logs | Log schema modifications only (create, update, delete). Not views |
| **Change approval workflow** | "Changes should require approval" | Slows down iteration. Creates bottleneck. Inappropriate for config/schema tools where speed matters | Trust authenticated users. Audit trail provides accountability without friction |
| **Real-time collaboration** | "Multiple users editing same schema" | Massive engineering complexity. Conflict resolution is hard. Operational transforms or CRDTs needed | v1.3 is single-user editing. Version history is the collaboration mechanism |
| **Immutable audit storage** | "Audit logs must be tamper-proof" | Over-engineering for internal tool. Adds infrastructure complexity (separate append-only store) | Redis is fine for internal tooling. If compliance needed later, export mechanism is sufficient |
| **MFA/2FA** | "Security requires multiple factors" | Google SSO already provides Google's security (including their 2FA). Adding another layer creates friction without proportional security benefit for internal tool | Rely on Google's account security. If enterprise needs MFA, they configure it in Google Workspace |

---

## Feature Dependencies

```
                           +------------------+
                           |  BetterAuth Core |
                           |  (Google OAuth)  |
                           +--------+---------+
                                    |
              +---------------------+---------------------+
              |                     |                     |
              v                     v                     v
     +--------+--------+   +-------+-------+    +--------+--------+
     | Session Mgmt    |   | User Storage  |    | Auth Middleware |
     | (persist login) |   | (Redis/DB)    |    | (protect routes)|
     +--------+--------+   +-------+-------+    +--------+--------+
              |                     |                     |
              |           +---------+---------+           |
              |           |                   |           |
              v           v                   v           v
     +--------+--------+  +-------+-------+  +-----------+----------+
     | Header UI       |  | Author on     |  | Protected Dashboard  |
     | (avatar, logout)|  | Schema Save   |  | Routes               |
     +--------+--------+  +-------+-------+  +----------------------+
              |                   |
              |                   v
              |           +-------+-------+
              |           | Version Hist  |
              |           | w/ Author     |
              |           +-------+-------+
              |                   |
              +--------+----------+
                       |
                       v
              +--------+--------+
              | Version Restore |
              | (creates new    |
              | version w/      |
              | current author) |
              +-----------------+
```

**Key Dependency Chain:**
1. BetterAuth must be configured before any auth features work
2. User storage must exist before author attribution works
3. Session management must work before protected routes make sense
4. Author attribution must work before version history shows authors
5. Version history with authors must exist before restore makes sense

---

## MVP Definition

### Launch With (v1.3)

These are non-negotiable for the milestone to be considered complete.

1. **Google SSO authentication** - Login/logout with Google account
2. **Persistent sessions** - Stay logged in across browser restarts
3. **Protected routes** - Dashboard requires authentication
4. **User header display** - Show logged-in user (name + avatar) in header
5. **Author on schema versions** - Every save records who made it
6. **Version history with authors** - See author name/avatar in version list
7. **Login redirect** - After login, return to intended page

### Add After Validation (v1.4+)

Defer these until v1.3 is validated with users.

- **Version restore** - One-click restore with clear audit trail
- **Activity feed** - Recent changes across all platforms
- **Change annotations** - Optional "why" message on save
- **Author filtering** - Filter history by who made changes
- **Additional SSO providers** - GitHub, Microsoft (if Google-only proves limiting)

### Future Consideration (v2+)

Explicitly out of scope for near-term.

- **Role-based permissions** - Only if team size/compliance demands it
- **Change approval workflows** - Only if regulated industries adopt
- **Detailed action logging** - Only if compliance requirements emerge
- **Session management UI** - View/revoke sessions from other devices

---

## Implementation Notes

### BetterAuth Integration Points

Based on official BetterAuth documentation:

```typescript
// Expected configuration shape
{
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      prompt: "select_account", // Force account picker
    }
  },
  baseURL: process.env.NEXTAUTH_URL // Critical for OAuth callback
}
```

**User data available from Google OAuth:**
- Email address
- Display name
- Profile image URL

**Session persistence:**
- Cookie-based with `rememberMe` (default: true)
- `useSession` hook for reactive UI updates
- `auth.api.getSession()` for server-side access

### Author Attribution Schema

Extend existing version metadata:

```typescript
// Current version structure (hypothesis - verify in codebase)
interface SchemaVersion {
  version: string;
  content: object;
  createdAt: string;
  // ADD:
  authorId: string;      // User ID from BetterAuth
  authorName: string;    // Denormalized for display
  authorImage?: string;  // Avatar URL
}
```

### Audit Trail Scope

What to log (table stakes):
- Schema version created (who, when, what platform/version)
- Schema version updated (who, when, what platform/version)
- Schema version deleted (if supported)

What NOT to log (anti-feature):
- Schema views/reads
- Navigation events
- Search queries
- Failed save attempts

---

## Competitor Analysis

### Confluent Schema Registry
- Authentication via API keys or tokens
- Audit logs capture register, update, delete events
- Schema Registry management events track who modified what
- Enterprise-grade but complex for small teams

### LaunchDarkly
- Unlimited change history (on Enterprise plans)
- Audit log shows flag changes with user attribution
- 30-day history limit on lower tiers
- Approval workflows available (but optional)

### Flagsmith
- Audit log with who/what/when
- Self-hosted option for compliance needs
- Change requests feature (optional workflow)
- Simpler than LaunchDarkly for smaller teams

**Takeaway:** ParamTune's v1.3 should match Flagsmith's simplicity - clear audit trail without workflow overhead. Enterprise features (approval flows, detailed logging) can come later if demand emerges.

---

## Confidence Assessment

| Area | Confidence | Rationale |
|------|------------|-----------|
| Table stakes list | HIGH | Well-established patterns across developer tools |
| Anti-features list | HIGH | Common mistakes documented in multiple sources |
| BetterAuth capabilities | MEDIUM | Verified via official docs, but haven't tested integration |
| Complexity estimates | MEDIUM | Based on similar implementations, actual may vary |
| Competitor patterns | HIGH | Direct documentation from Confluent, LaunchDarkly, Flagsmith |

---

## Sources

### Official Documentation (HIGH confidence)
- [BetterAuth Google Integration](https://www.better-auth.com/docs/authentication/google)
- [BetterAuth Basic Usage](https://www.better-auth.com/docs/basic-usage)
- [Confluent Schema Registry Audit Events](https://docs.confluent.io/cloud/current/monitoring/audit-logging/event-methods/sr-management.html)
- [LaunchDarkly Change History](https://docs.launchdarkly.com/home/code/audit-log-history)

### Industry Best Practices (MEDIUM confidence)
- [Audit Trail Best Practices - DataSunrise](https://www.datasunrise.com/knowledge-center/data-audit-trails/)
- [Audit Logging Guide - Splunk](https://www.splunk.com/en_us/blog/learn/audit-logs.html)
- [Authentication UX Guidelines - Smashing Magazine](https://www.smashingmagazine.com/2022/08/authentication-ux-design-guidelines/)
- [Building Audit Logs - Infisical (Medium)](https://medium.com/@tony.infisical/guide-to-building-audit-logs-for-application-software-b0083bb58604)

### Competitive Analysis (MEDIUM confidence)
- [Flagsmith Feature Flags](https://www.flagsmith.com/feature-flags-and-remote-config)
- [LaunchDarkly vs Flagsmith Comparison](https://www.statsig.com/perspectives/feature-flags-comparison-launchdarkly-flagsmith)
