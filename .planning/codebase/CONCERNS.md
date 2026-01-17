# Codebase Concerns

**Analysis Date:** 2026-01-17

## Tech Debt

**Unprotected JSON.parse in Server Action:**
- Issue: `JSON.parse()` called without try/catch
- File: `src/app/dashboard/[platform]/[version]/page.tsx:33`
- Why: Quick implementation without error handling
- Impact: Malformed JSON crashes server action with unhelpful 500 error
- Fix approach: Wrap in try/catch, return meaningful error to client

**Type-unsafe Error Catching:**
- Issue: All catch blocks use `error: any` instead of `unknown`
- Files: `src/app/api/[platform]/route.ts:26,50`, `src/app/api/[platform]/[version]/route.ts:34`, `src/app/api/[platform]/versions/route.ts:21,57`, `src/app/api/schemas/route.ts:56`
- Why: TypeScript defaults to `any` for caught errors
- Impact: Type safety lost in error handling paths
- Fix approach: Change to `catch (error: unknown)`, use `instanceof Error` checks

**Multiple `as any` Type Assertions:**
- Issue: Type assertions bypass TypeScript checking
- Files: `src/components/SchemaTabs.tsx:36,98,165,166`, `src/app/dashboard/page.tsx:57`, `src/app/dashboard/[platform]/[version]/page.tsx:52,64,65`
- Why: Quick fixes for complex type situations
- Impact: Potential runtime errors if data shape changes
- Fix approach: Define proper types for schema objects

## Known Bugs

**No Known Bugs Documented:**
- No TODO/FIXME comments found indicating known bugs
- Codebase is relatively clean

## Security Considerations

**CORS Allows Wildcard:**
- Risk: `CORS_ORIGIN='*'` allows any origin in development
- File: `src/middleware.ts:10`
- Current mitigation: Environment variable controls allowed origin
- Recommendations: Add warning log if `*` used in production, document secure configuration

**Unvalidated Route Parameters:**
- Risk: `decodeURIComponent()` used without validating decoded values are safe identifiers
- Files: All route files - `src/app/api/[platform]/route.ts`, `src/app/api/[platform]/[version]/route.ts`, `src/app/api/[platform]/versions/route.ts`, dashboard pages
- Current mitigation: None - values passed directly to Redis
- Recommendations: Validate platform/version format (alphanumeric, dots, dashes only)

**Missing Input Validation:**
- Risk: Platform and version names not validated for format
- Files: `src/app/dashboard/[platform]/page.tsx:63`, `src/app/dashboard/page.tsx:17-22`
- Current mitigation: Only whitespace trimming
- Recommendations: Add regex validation for valid identifiers

## Performance Bottlenecks

**N+1 Query Pattern in getPlatforms():**
- Problem: Fetches all platform keys, then calls `getPlatform()` for each
- File: `src/models/Platform.ts:8-26`
- Measurement: O(1 + N) Redis calls for N platforms
- Cause: `Promise.all(platforms.map(getPlatform))` after SCAN
- Improvement path: Use Redis pipeline for batch operations

## Fragile Areas

**Schema Dependency Resolution:**
- File: `src/models/Schema.ts`
- Why fragile: Complex recursive logic with semver matching
- Common failures: Circular dependencies (detected), missing dependencies (returns null)
- Safe modification: Add comprehensive tests before changes
- Test coverage: No tests currently

**JSON Editor Keyboard Handlers:**
- File: `src/components/JsonEditable/utils/keyboardHandlers.ts`
- Why fragile: Complex brace matching and indentation logic (273 lines)
- Common failures: Edge cases in nested structures
- Safe modification: Manual testing with various JSON structures
- Test coverage: No tests currently

## Scaling Limits

**Redis Sorted Sets:**
- Current capacity: Suitable for thousands of schemas/versions
- Limit: Memory-bound (Redis stores all data in memory)
- Symptoms at limit: Out of memory errors, slow SCAN operations
- Scaling path: Redis cluster or separate Redis instances per tenant

**Platform Listing:**
- Current capacity: Works well with <100 platforms
- Limit: SCAN + N queries becomes slow with thousands of platforms
- Symptoms at limit: Dashboard load time increases linearly
- Scaling path: Pagination, caching, or batch Redis operations

## Dependencies at Risk

**No Critical Risks Identified:**
- All major dependencies (Next.js, React, ioredis) are actively maintained
- `tailwindcss-animate` is stable with no breaking changes expected

## Missing Critical Features

**No Test Framework:**
- Problem: Zero test coverage for business logic
- Current workaround: Manual testing, `pnpm typecheck` for type errors
- Blocks: Confident refactoring, CI/CD quality gates
- Implementation complexity: Low - Vitest can be added easily

**Missing Error Boundaries:**
- Problem: No React Error Boundaries for graceful degradation
- Current workaround: Errors crash entire page
- Blocks: Better user experience on errors
- Implementation complexity: Low - Add `error.tsx` files in App Router

**No Structured Logging:**
- Problem: Console.log only, no structured log format
- Current workaround: Search console output manually
- Blocks: Production debugging, log aggregation
- Implementation complexity: Medium - Add pino or similar

## Test Coverage Gaps

**Schema Model - High Priority:**
- What's not tested: Circular dependency detection, semver resolution, cascade updates
- File: `src/models/Schema.ts`
- Risk: Logic bugs in core business functionality
- Priority: High
- Difficulty to test: Medium - Need Redis mocking

**API Routes - Medium Priority:**
- What's not tested: Request/response handling, error scenarios
- Files: `src/app/api/*/route.ts`
- Risk: API contract breakage
- Priority: Medium
- Difficulty to test: Low - Straightforward HTTP testing

**JSON Editor - Low Priority:**
- What's not tested: Keyboard handlers, syntax highlighting
- Files: `src/components/JsonEditable/utils/`
- Risk: Editor usability issues
- Priority: Low (UI can be manually tested)
- Difficulty to test: Medium - DOM interaction testing

## Large Files (>200 lines)

Consider splitting for maintainability:
- `src/models/Schema.ts` (301 lines) - Split dependency resolution into separate module
- `src/components/JsonEditable/JsonEditable.tsx` (287 lines) - Extract sub-components
- `src/components/JsonEditable/utils/keyboardHandlers.ts` (273 lines) - Split by feature
- `src/components/JsonEditable/utils/optimizedSyntaxHighlighter.ts` (230 lines) - Extract themes
- `src/components/SchemaHistory/SchemaDiff.tsx` (220 lines) - Extract diff logic
- `src/components/Sidebar.tsx` (213 lines) - Split navigation from search
- `src/components/SchemaHistory/SchemaHistory.tsx` (213 lines) - Extract list rendering

---

*Concerns audit: 2026-01-17*
*Update as issues are fixed or new ones discovered*
