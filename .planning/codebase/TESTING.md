# Testing Patterns

**Analysis Date:** 2026-01-17

## Test Framework

**Runner:**
- Not configured - No test framework installed

**Assertion Library:**
- Not configured

**Run Commands:**
```bash
# No test commands available
# Recommended: Add Vitest
pnpm add -D vitest @testing-library/react @testing-library/jest-dom
```

## Test File Organization

**Location:**
- Not established - No test files exist
- Recommended: Co-locate tests with source (`*.test.ts` alongside `*.ts`)

**Naming:**
- Recommended pattern: `{module}.test.ts` for units, `{feature}.integration.test.ts`

**Structure:**
```
src/
  models/
    Schema.ts
    Schema.test.ts        # (recommended)
  components/
    ui/
      Button.tsx
      Button.test.tsx     # (recommended)
```

## Test Structure

**Recommended Suite Organization:**
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('ModuleName', () => {
  describe('functionName', () => {
    beforeEach(() => {
      // reset state
    })

    it('should handle valid input', () => {
      // arrange
      // act
      // assert
    })

    it('should throw on invalid input', () => {
      expect(() => fn(null)).toThrow('error message')
    })
  })
})
```

**Patterns:**
- Use beforeEach for per-test setup
- Use afterEach to restore mocks
- One assertion focus per test
- Arrange/Act/Assert structure

## Mocking

**Recommended Framework:**
- Vitest built-in mocking (`vi`)

**Patterns:**
```typescript
import { vi } from 'vitest'
import redis from '@/connections/redis'

vi.mock('@/connections/redis', () => ({
  default: {
    zadd: vi.fn(),
    zrevrangebyscore: vi.fn(),
  }
}))
```

**What to Mock:**
- Redis operations (`src/connections/redis.ts`)
- File system if needed
- External APIs

**What NOT to Mock:**
- Pure utility functions (`src/lib/utils.ts`)
- React component internals
- Simple transformations

## Fixtures and Factories

**Recommended Test Data Pattern:**
```typescript
// Factory function
function createTestPlatform(overrides?: Partial<Platform>): Platform {
  return {
    name: 'test-platform',
    versions: ['1.0.0'],
    ...overrides
  }
}

function createTestSchema(overrides?: Partial<Record<string, unknown>>): Record<string, unknown> {
  return {
    feature: { enabled: true },
    ...overrides
  }
}
```

**Location:**
- Factory functions: In test file or `tests/factories/`
- Shared fixtures: `tests/fixtures/`

## Coverage

**Requirements:**
- Not configured
- Recommended: 80% line coverage for models

**Configuration:**
- Recommended: Vitest coverage via c8

**View Coverage:**
```bash
# After adding Vitest
pnpm test -- --coverage
open coverage/index.html
```

## Test Types

**Unit Tests (Recommended Priority):**
- `src/models/Schema.ts` - Dependency resolution, circular detection
- `src/models/Platform.ts` - CRUD operations
- `src/lib/versionUtils.ts` - Semver sorting
- `src/components/JsonEditable/utils/*.ts` - Syntax highlighting, keyboard handlers

**Integration Tests:**
- API route handlers (`src/app/api/`)
- Full schema composition flow

**E2E Tests:**
- Not recommended initially
- Consider Playwright for dashboard flow testing later

## Common Patterns

**Async Testing:**
```typescript
it('should fetch schema', async () => {
  const result = await getSchema('platform', '1.0.0')
  expect(result).toMatchObject({ feature: true })
})
```

**Error Testing:**
```typescript
it('should throw on circular dependency', async () => {
  await expect(
    saveSchema('a', '1.0', { '@extends': ['a/1.0'] })
  ).rejects.toThrow('Circular dependency')
})
```

**Redis Mocking:**
```typescript
import { vi } from 'vitest'
import redis from '@/connections/redis'

vi.mock('@/connections/redis')

beforeEach(() => {
  vi.mocked(redis.zrevrangebyscore).mockResolvedValue(['{"data": true}'])
})
```

**Snapshot Testing:**
- Not recommended for this codebase
- Prefer explicit assertions for clarity

## Available Quality Checks

**Current Scripts (`package.json`):**
```bash
pnpm lint        # ESLint
pnpm typecheck   # TypeScript type checking
pnpm build       # Build validation
pnpm analyze     # Bundle analysis
```

**Contributing Guidelines (from README.md):**
1. Follow existing code style and conventions
2. Run `pnpm lint` and `pnpm typecheck` before committing
3. Use `@/*` path aliases for imports from `src/`
4. Mark client components with `'use client'` directive

## Recommended Test Setup

**Install Vitest:**
```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Create `vitest.config.ts`:**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Add test script to `package.json`:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

*Testing analysis: 2026-01-17*
*Update when test patterns change*
