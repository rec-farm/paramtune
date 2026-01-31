# Phase 16: Audit Trail UI - Research

**Researched:** 2026-01-31
**Domain:** Version history restore functionality with author attribution (React/Next.js)
**Confidence:** HIGH

## Summary

This phase adds version restore functionality to the existing schema history UI. Phase 15 already established:
- `Author` type with `id`, `name`, `image` fields
- `saveSchema()` accepting optional author parameter
- `SchemaHistory` component displaying author name/avatar with "Unknown" fallback for legacy entries

The main work for Phase 16 is:
1. Add a "Restore" button to historical versions in SchemaHistory
2. When clicked, call saveSchema with the historical content and current user as author
3. Revalidate the page to show the restored version at the top of history
4. The restored version will naturally have correct attribution (current user, not the original author)

The implementation follows established patterns: `useTransition` for pending state, server action passed as prop, page revalidation after mutation.

**Primary recommendation:** Add a Restore button to SchemaHistory that calls a passed `restoreVersion` server action, using `useTransition` to show loading state, and rely on page revalidation to update the UI.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | UI framework | `useTransition` for pending states during restore |
| Next.js | 15.x | Server actions | Restore action triggers saveSchema and revalidatePath |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | existing | Date formatting | Already used in SchemaHistory |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Server action + revalidation | Optimistic update with useOptimistic | Simpler implementation; restore is infrequent operation where brief loading is acceptable |
| Passing restore action as prop | Reading session inside SchemaHistory | Session access would require server component; current pattern keeps SchemaHistory as pure client component |

**Installation:**
```bash
# No new packages needed - all dependencies already present
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── models/Schema.ts           # Already complete from Phase 15
├── app/dashboard/[platform]/[version]/page.tsx  # Add restoreVersion action
├── components/SchemaHistory/SchemaHistory.tsx   # Add restore button UI
└── components/SchemaTabs.tsx  # Pass restoreVersion to SchemaHistory
```

### Pattern 1: Server Action for Restore
**What:** Define restore action in page.tsx server component where session is available
**When to use:** Any mutation that needs the current user's identity
**Example:**
```typescript
// Source: follows existing updateSchema pattern in page.tsx
async function restoreVersion(content: Record<string, unknown>) {
  'use server'

  // author is captured from page scope (session.user)
  const author: Author | undefined = user
    ? { id: user.id, name: user.name || 'Unknown', image: user.image || undefined }
    : undefined

  await saveSchema(platformName, versionName, content, author)
  revalidatePath('/dashboard/[platform]/[version]', 'page')
}
```

### Pattern 2: useTransition for Restore Loading State
**What:** Wrap restore call in transition to show pending indicator on button
**When to use:** Any async operation triggered by user interaction
**Example:**
```typescript
// Source: https://react.dev/reference/react/useTransition
const [isPending, startTransition] = useTransition()

const handleRestore = (content: Record<string, unknown>) => {
  startTransition(async () => {
    await restoreVersion(content)
  })
}

<Button disabled={isPending} onClick={() => handleRestore(entry.content)}>
  {isPending ? 'Restoring...' : 'Restore'}
</Button>
```

### Pattern 3: Prop Drilling Server Action
**What:** Pass server action from page -> SchemaTabs -> SchemaHistory
**When to use:** When client component needs to trigger server mutation
**Example:**
```typescript
// page.tsx passes to SchemaTabs
<SchemaTabs
  updateSchema={updateSchema}
  restoreVersion={restoreVersion}  // new prop
  history={history}
  currentSchema={schema}
/>

// SchemaTabs passes to SchemaHistory
<SchemaHistory
  history={history}
  currentSchema={currentSchema}
  onRestore={restoreVersion}  // callback prop
/>
```

### Anti-Patterns to Avoid
- **Confirmation dialog for restore:** Adds complexity; restore is non-destructive (creates new version, history preserved)
- **Optimistic update for restore:** Unnecessary complexity for infrequent action; simple loading state is sufficient
- **Restoring with original author:** Would misrepresent who performed the restore; always use current user

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Loading state management | Manual isLoading state | `useTransition` | React concurrent feature, handles async naturally |
| Page data refresh | Custom refetch logic | `revalidatePath` | Next.js server cache invalidation, guaranteed fresh data |
| Author data construction | Custom session parsing | Existing pattern from Phase 15 | Already established in updateSchema action |

**Key insight:** The codebase already has the complete pattern for saving with author attribution. Restore is just "save this historical content as current user."

## Common Pitfalls

### Pitfall 1: Restoring with Original Author Instead of Current User
**What goes wrong:** Restored version shows original author, not who performed restore
**Why it happens:** Copying author field from historical entry instead of using current session
**How to avoid:** Always pass current user as author in restoreVersion action
**Warning signs:** Version history shows old user made the "restore" change

### Pitfall 2: Not Disabling Restore on Current Version
**What goes wrong:** User can "restore" the current version, creating duplicate entry
**Why it happens:** Restore button shown on all entries including latest
**How to avoid:** Hide or disable restore button on index 0 (current version)
**Warning signs:** Identical consecutive entries in history

### Pitfall 3: Restore Button Visible During Pending State
**What goes wrong:** User clicks restore multiple times while waiting
**Why it happens:** Not disabling button during transition
**How to avoid:** Disable button while `isPending` is true, show loading text
**Warning signs:** Multiple duplicate versions created

### Pitfall 4: Not Updating SchemaTabs Type Definition
**What goes wrong:** TypeScript error when passing new prop
**Why it happens:** SchemaTabsProps doesn't include restoreVersion callback
**How to avoid:** Update type definition along with component changes
**Warning signs:** TS error about missing property on SchemaTabs

## Code Examples

Verified patterns from official sources and existing codebase:

### Current updateSchema Action (for reference)
```typescript
// Source: existing codebase - src/app/dashboard/[platform]/[version]/page.tsx
async function updateSchema(formData: FormData) {
  'use server'

  let content: Record<string, unknown>
  try {
    content = JSON.parse(formData.get('content') as string) as Record<
      string,
      unknown
    >
  } catch {
    throw new Error('Invalid JSON content')
  }

  const author: Author | undefined = user
    ? { id: user.id, name: user.name || 'Unknown', image: user.image || undefined }
    : undefined

  await saveSchema(platformName, versionName, content, author)
  revalidatePath('/dashboard/[platform]/[version]', 'page')
}
```

### Proposed restoreVersion Action
```typescript
// Target implementation - similar to updateSchema but takes content directly
async function restoreVersion(content: Record<string, unknown>) {
  'use server'

  const author: Author | undefined = user
    ? { id: user.id, name: user.name || 'Unknown', image: user.image || undefined }
    : undefined

  await saveSchema(platformName, versionName, content, author)
  revalidatePath('/dashboard/[platform]/[version]', 'page')
}
```

### useTransition for Restore Button
```typescript
// Source: https://react.dev/reference/react/useTransition
// Applied to SchemaHistory component
const [isPending, startTransition] = useTransition()

const handleRestore = (content: Record<string, unknown>) => {
  startTransition(async () => {
    await onRestore(content)
  })
}
```

### Button States Pattern (from existing codebase)
```typescript
// Source: existing codebase - src/components/SchemaEditorForm.tsx
<Button
  type="submit"
  variant="primary"
  size="sm"
  disabled={!isValid || isPending}
>
  {isPending ? 'Validating...' : 'Save'}
</Button>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useOptimistic for all mutations | useTransition for non-critical UI | React 19 | Simpler for operations where brief loading is acceptable |
| Passing FormData for all actions | Typed parameters for non-form actions | Standard practice | Cleaner API when not using HTML forms |

**Deprecated/outdated:**
- None - patterns used are current

## Open Questions

Things that couldn't be fully resolved:

1. **Should restore require confirmation?**
   - What we know: Restore is non-destructive (creates new version, preserves history)
   - What's unclear: User expectation for safety rails
   - Recommendation: No confirmation - operation is reversible by restoring again; keeps UX simple

2. **Should "Restore" be a different verb?**
   - What we know: "Restore" is common in version control UIs
   - What's unclear: Whether "Revert to this version" or "Make current" is clearer
   - Recommendation: Use "Restore" - concise and widely understood

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/app/dashboard/[platform]/[version]/page.tsx` - updateSchema pattern
- Existing codebase: `src/components/SchemaHistory/SchemaHistory.tsx` - current UI structure
- Existing codebase: `src/components/SchemaEditorForm.tsx` - useTransition usage pattern
- [React useTransition docs](https://react.dev/reference/react/useTransition) - official hook documentation

### Secondary (MEDIUM confidence)
- [React useTransition best practices](https://levelup.gitconnected.com/%EF%B8%8F-best-practices-of-using-usetransition-in-react-d584c32aac24) - community patterns

### Tertiary (LOW confidence)
- WebSearch patterns for version history UIs - general UX patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all patterns established in codebase
- Architecture: HIGH - follows existing updateSchema pattern exactly
- Pitfalls: HIGH - derived from existing codebase patterns and common sense

**Research date:** 2026-01-31
**Valid until:** 60 days (stable feature, no external dependencies changing)
