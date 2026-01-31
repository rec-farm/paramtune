# Phase 15: Author Attribution - Research

**Researched:** 2026-01-31
**Domain:** User identity tracking for schema version history (BetterAuth + Redis)
**Confidence:** HIGH

## Summary

This phase adds author attribution to schema saves, recording who made each change. The implementation involves:

1. Extending the `Schema` type with optional author fields (`authorId`, `authorName`, `authorImage`)
2. Modifying `saveSchema()` to accept and store author information
3. Updating the history display to show author data (or "Unknown" for legacy entries)
4. Passing user context from Server Components to the save action

The pattern is straightforward: BetterAuth already provides `session.user` with `id`, `name`, and `image` fields. The dashboard layout already validates the session server-side. The save action needs to receive this user data and include it in the Redis stored JSON.

**Primary recommendation:** Add optional author fields to the Schema type, modify saveSchema to accept author data, and update the page component to pass session.user to the save action.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-auth | ^1.4.18 | Authentication | Already integrated, provides session.user with id/name/image |
| ioredis | ^5.8.2 | Redis client | Already used for schema storage |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | existing | Date formatting | Already used in SchemaHistory for timestamp display |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Storing full user object | Storing only userId + lookup | More queries vs. denormalized data; denormalized is simpler for display |
| Server action with user param | Reading session inside action | Passing user is explicit and testable |

**Installation:**
```bash
# No new packages needed - all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── models/Schema.ts           # Add Author type, update Schema type and saveSchema
├── app/dashboard/[platform]/[version]/page.tsx  # Pass user to updateSchema action
└── components/SchemaHistory/  # Display author info in history
```

### Pattern 1: Optional Author Fields for Backward Compatibility
**What:** Make author fields optional in the Schema type so legacy data (without author) parses without error
**When to use:** Always when adding new fields to existing stored data
**Example:**
```typescript
// Source: TypeScript optional fields pattern
export type Author = {
  id: string
  name: string
  image?: string  // Avatar URL, may be null/undefined
}

export type Schema = {
  content: Record<string, unknown>
  dependencies: string[]
  output: Record<string, unknown>
  author?: Author  // Optional for backward compatibility with legacy schemas
}
```

### Pattern 2: Session-to-Action Data Flow
**What:** Pass user data from Server Component (which has validated session) to server action
**When to use:** When actions need to record who performed them
**Example:**
```typescript
// In page.tsx Server Component:
const session = await auth.api.getSession({ headers: await headers() })
const user = session?.user

async function updateSchema(formData: FormData) {
  'use server'
  const author = user ? { id: user.id, name: user.name, image: user.image } : undefined
  await saveSchema(platformName, versionName, content, author)
}
```

### Pattern 3: Graceful Legacy Fallback Display
**What:** Show placeholder when author data is missing
**When to use:** Displaying historical entries that predate the author field
**Example:**
```typescript
// In SchemaHistory component:
const authorDisplay = entry.author?.name || 'Unknown'
const authorAvatar = entry.author?.image
```

### Anti-Patterns to Avoid
- **Reading session inside saveSchema:** Couples data layer to auth; pass author explicitly
- **Failing on missing author:** Legacy schemas don't have author; use optional fields
- **Storing entire session object:** Only store needed fields (id, name, image)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Getting current user | Custom session parsing | `auth.api.getSession()` | BetterAuth handles cookie validation, session lookup |
| Avatar fallback UI | Custom initials logic | Existing UserMenu pattern | Project already has avatar-with-fallback component |
| Date formatting | Manual date strings | date-fns `formatDistanceToNow` | Already used in SchemaHistory |

**Key insight:** The codebase already has patterns for all UI concerns (avatar display, session access). The main work is plumbing the data through.

## Common Pitfalls

### Pitfall 1: Breaking Legacy Schema Parsing
**What goes wrong:** Making author a required field causes JSON.parse or type errors on old data
**Why it happens:** Existing Redis entries don't have the author field
**How to avoid:** Use `author?: Author` (optional) in the type definition
**Warning signs:** TypeScript errors about missing properties, runtime errors on getSchema

### Pitfall 2: Closure Capture in Server Actions
**What goes wrong:** User data becomes stale if captured incorrectly in action closure
**Why it happens:** Server actions are serialized; need to capture values at definition time
**How to avoid:** Capture user data in the action's outer scope (page component), not inside the action
**Warning signs:** User data is always undefined or wrong user

### Pitfall 3: Missing User When Session Expires
**What goes wrong:** Save action proceeds without author, or crashes
**Why it happens:** Session expired between page load and save
**How to avoid:** Make author optional in saveSchema signature; dashboard layout already redirects if no session
**Warning signs:** Saves with undefined author for logged-in users

### Pitfall 4: Storing Stale User Data
**What goes wrong:** Author name/image becomes outdated if user updates profile
**Why it happens:** We snapshot user data at save time (intentional for audit trail)
**How to avoid:** This is actually correct behavior - the author at save time is what matters for history
**Warning signs:** None - this is the desired behavior (point-in-time attribution)

## Code Examples

Verified patterns from official sources and existing codebase:

### Getting Session Server-Side (from dashboard/layout.tsx)
```typescript
// Source: existing codebase - src/app/dashboard/layout.tsx
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

const session = await auth.api.getSession({
  headers: await headers()
})

// session.user has: id, name, email, image, emailVerified, createdAt, updatedAt
```

### User Fields Available (from BetterAuth docs)
```typescript
// Source: https://www.better-auth.com/docs/concepts/database
interface User {
  id: string          // Unique identifier
  name: string        // Display name
  email: string       // Email address
  emailVerified: boolean
  image?: string      // Avatar URL (optional)
  createdAt: Date
  updatedAt: Date
}
```

### Current saveSchema Signature (needs modification)
```typescript
// Source: existing codebase - src/models/Schema.ts
export async function saveSchema(
  platform: string,
  version: string,
  content: Record<string, unknown>
) {
  // ... stores JSON.stringify({ dependencies, content, output })
}
```

### Updated saveSchema with Author
```typescript
// Target implementation
export type Author = {
  id: string
  name: string
  image?: string
}

export async function saveSchema(
  platform: string,
  version: string,
  content: Record<string, unknown>,
  author?: Author  // Optional for backward compatibility
) {
  // ... stores JSON.stringify({ dependencies, content, output, author })
}
```

### Avatar Display Pattern (from existing UserMenu)
```typescript
// Source: existing codebase - src/components/UserMenu.tsx
{user.image ? (
  <img
    src={user.image}
    alt=""
    className="h-7 w-7 rounded-full border border-primary/20"
  />
) : (
  <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center">
    <span className="text-xs font-medium">
      {user.name?.charAt(0).toUpperCase() || '?'}
    </span>
  </div>
)}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No author tracking | Author on each save | This phase | Audit trail enabled |
| Required fields only | Optional fields for schema evolution | Standard practice | Backward compatibility maintained |

**Deprecated/outdated:**
- None - this is a new feature addition

## Open Questions

Things that couldn't be fully resolved:

1. **Should author be displayed inline in history list or only in detail view?**
   - What we know: SchemaHistory has both list view and detail panel
   - What's unclear: UX preference for author visibility
   - Recommendation: Show author in detail view; optionally add small avatar to list items

2. **Should we backfill author data for existing schemas?**
   - What we know: Existing schemas have no author; could attempt lookup by timestamp correlation
   - What's unclear: Whether this is valuable or even possible
   - Recommendation: Don't backfill; show "Unknown" - simpler and honest

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/models/Schema.ts` - current Schema type and saveSchema implementation
- Existing codebase: `src/app/dashboard/layout.tsx` - session retrieval pattern
- Existing codebase: `src/components/UserMenu.tsx` - avatar display pattern
- [BetterAuth User/Database docs](https://www.better-auth.com/docs/concepts/database) - user fields

### Secondary (MEDIUM confidence)
- [BetterAuth Session Management](https://www.better-auth.com/docs/concepts/session-management) - session structure

### Tertiary (LOW confidence)
- General TypeScript optional fields patterns from web search

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already in use, no new deps
- Architecture: HIGH - follows existing patterns in codebase
- Pitfalls: HIGH - common TypeScript/backward-compat patterns, verified against existing code

**Research date:** 2026-01-31
**Valid until:** 60 days (stable feature, no external dependencies changing)
