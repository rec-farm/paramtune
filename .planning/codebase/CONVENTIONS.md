# Coding Conventions

**Analysis Date:** 2026-01-17

## Naming Patterns

**Files:**
- PascalCase for components: `CreatePlatformForm.tsx`, `SchemaEditorForm.tsx`, `SchemaTabs.tsx`
- camelCase for utilities: `utils.ts`, `versionUtils.ts`, `fileUtils.ts`
- lowercase for connections/config: `redis.ts`
- `route.ts` for API handlers
- `*.test.ts` for tests (none currently)

**Functions:**
- camelCase for all functions: `getPlatforms()`, `saveSchema()`, `previewJsonOutput()`
- No special prefix for async functions
- `handle*` for event handlers: `handleClick`, `handleSubmit`
- `use*` for hooks: `useOptimizedJsonEditor()`, `useTextareaRef()`

**Variables:**
- camelCase for variables: `isValid`, `isTouched`, `scrollTop`
- UPPER_SNAKE_CASE for constants: `const TABS = ['Editor', 'Preview', 'History']`
- No underscore prefix for private (TypeScript access modifiers instead)

**Types:**
- PascalCase for interfaces/types: `ButtonProps`, `Schema`, `Platform`
- No `I` prefix for interfaces: `CardProps` not `ICardProps`
- PascalCase for type aliases: `TabKey = (typeof TABS)[number]`

## Code Style

**Formatting (`.prettierrc`):**
- No semicolons: `semi: false`
- Single quotes: `singleQuote: true`
- 2 space indentation: `tabWidth: 2`
- Spaces, not tabs: `useTabs: false`

**Linting (`eslint.config.mjs`):**
- Extends: `eslint-config-next/core-web-vitals`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`
- Run: `pnpm lint`

**TypeScript (`tsconfig.json`):**
- Strict mode enabled
- Target: ES2022
- Module: ESNext with bundler resolution
- Path alias: `@/*` → `./src/*`

## Import Organization

**Order:**
1. React imports: `import { useState, useCallback } from 'react'`
2. Next.js imports: `import { NextResponse } from 'next/server'`
3. External packages: `import semver from 'semver'`
4. Internal modules with alias: `import Button from '@/components/ui/Button'`
5. Relative imports: `import { cn } from './utils'`
6. Type imports: `import type { CardProps } from './Card'`

**Grouping:**
- Blank lines between groups
- Type imports separated with `import type`

**Path Aliases:**
- `@/` maps to `src/`
- Always use `@/` for cross-directory imports

## Error Handling

**Patterns:**
- Throw errors in models/services
- Catch at page/route boundaries
- Return JSON errors from API routes: `NextResponse.json({ error }, { status: 500 })`

**Error Types:**
- Use descriptive messages: `throw new Error('Circular dependency detected at ${key}')`
- Log before throwing when helpful: `console.error('Error saving platform:', error)`

**Async:**
- Use try/catch blocks (prefer over `.catch()` chains)
- Server actions throw, caught by React error boundaries

## Logging

**Framework:**
- Console built-ins: `console.log()`, `console.error()`
- No structured logging library

**Patterns:**
- Debug logging: `console.log('Server action received:', platformName)`
- Error logging: `console.error('GET /api/[platform] error', error)`
- Success logging: `console.log('Platform saved successfully:', name)`

**When:**
- Log server action inputs/outputs
- Log errors before throwing or returning
- Log API route errors with endpoint context

## Comments

**When to Comment:**
- Complex algorithms (dependency resolution, syntax highlighting)
- Non-obvious business logic
- Workarounds or intentional deviations

**JSDoc/TSDoc:**
- Used for utility functions in `src/lib/`
- Format: `/** Brief description */`
- Example from `src/lib/fileUtils.ts`:
```typescript
/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void>
```

**TODO Comments:**
- Not currently used in codebase
- Recommended format: `// TODO: description`

## Function Design

**Size:**
- Keep under 50 lines when possible
- Extract helpers for complex logic

**Parameters:**
- Max 3 parameters preferred
- Use object for 4+ parameters: `function create(options: CreateOptions)`
- Destructure in parameter list: `function process({ id, name }: ProcessParams)`

**Return Values:**
- Explicit return types for public functions
- Return early for guard clauses
- Use `void` for side-effect functions

## Module Design

**Exports:**
- Default exports for React components: `export default Button`
- Named exports for utilities/types: `export function cn()`, `export type Schema`
- Barrel exports via `index.ts` for feature directories

**Component Pattern:**
```typescript
const Component = forwardRef<HTMLElement, Props>(
  ({ className, ...props }, ref) => { ... }
)
Component.displayName = 'Component'
export default Component
```

**React Patterns:**
- Mark client components: `'use client'`
- Mark server functions: `'use server'`
- Use `forwardRef` for UI components
- Always set `displayName`

## CSS/Styling

**Approach:**
- Tailwind CSS utility classes
- `cn()` for conditional classes: `cn('base', condition && 'conditional')`
- CSS variables via globals.css
- No CSS modules or styled-components

**Class Organization:**
- Layout first: `flex`, `grid`, positioning
- Spacing: `p-*`, `m-*`, `gap-*`
- Typography: `text-*`, `font-*`
- Colors: `bg-*`, `text-*`
- States: `hover:`, `focus:`

---

*Convention analysis: 2026-01-17*
*Update when patterns change*
