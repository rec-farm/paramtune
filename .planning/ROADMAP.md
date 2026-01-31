# Roadmap: ParamTune

## Milestones

- [x] **[v1.0 MVP](milestones/v1.0-ROADMAP.md)** - Phases 1-4 (shipped 2026-01-18)
- [x] **[v1.1 Schema Diff & Polish](milestones/v1.1-ROADMAP.md)** - Phases 5-8 (shipped 2026-01-18)
- [x] **[v1.2 Performance & Polish](milestones/v1.2-ROADMAP.md)** - Phases 9-12 (shipped 2026-01-18)
- [ ] **v1.3 User System & Audit Trail** - Phases 13-16 (in progress)

## Completed Milestones

<details>
<summary>v1.0 MVP (Phases 1-4) - SHIPPED 2026-01-18</summary>

- [x] Phase 1: Editor UX (2/2 plans) - Autocomplete, theming
- [x] Phase 2: Schema Validation (1/1 plan) - Validation engine, warnings
- [x] Phase 3: Error Handling (1/1 plan) - Error boundaries, type-safe API
- [x] Phase 4: API & Docs (1/1 plan) - OpenAPI spec, docs page

</details>

<details>
<summary>v1.1 Schema Diff & Polish (Phases 5-8) - SHIPPED 2026-01-18</summary>

- [x] Phase 5: Autocomplete Fixes (1/1 plan) - Enter key fix, smarter triggers
- [x] Phase 6: Schema Diff Engine (1/1 plan) - Reusable diff module
- [x] Phase 7: Visual Diff UI (1/1 plan) - Side-by-side comparison page
- [x] Phase 8: Editor Improvements (1/1 plan) - Hover tooltip, loading indicator

</details>

<details>
<summary>v1.2 Performance & Polish (Phases 9-12) - SHIPPED 2026-01-18</summary>

- [x] Phase 9: Editor Performance (1/1 plan) - Debounced highlighting, memoized slices
- [x] Phase 10: Page Load Optimization (1/1 plan) - Lazy loading, code splitting
- [x] Phase 11: Dashboard Visual Refresh (1/1 plan) - Shadow system, card variants
- [x] Phase 12: Responsive Design (1/1 plan) - Mobile header, touch targets

</details>

## v1.3 User System & Audit Trail

**Milestone Goal:** Enable team accountability by tracking who makes each schema change

### Phase 13: Auth Infrastructure
**Goal:** Users can authenticate via Google and maintain persistent sessions
**Depends on:** Nothing (first phase of milestone)
**Requirements:** AUTH-01, AUTH-02, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User can click "Sign in with Google" and complete OAuth flow
  2. User remains logged in after closing and reopening browser
  3. User can log out with a single click from any page
**Plans:** TBD

Plans:
- [ ] 13-01: TBD

### Phase 14: Route Protection
**Goal:** Dashboard requires authentication with seamless UX
**Depends on:** Phase 13
**Requirements:** AUTH-03, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. Unauthenticated user visiting /dashboard/* is redirected to login
  2. After login, user is redirected to their originally intended page
  3. Logged-in user sees their Google name and avatar in the header
  4. User menu provides logout option
**Plans:** TBD

Plans:
- [ ] 14-01: TBD

### Phase 15: Author Attribution
**Goal:** Every schema save records who made the change
**Depends on:** Phase 14
**Requirements:** AUDT-01, AUDT-04
**Success Criteria** (what must be TRUE):
  1. Saving a schema records the current user's ID, name, and avatar
  2. Legacy schemas without author data do not cause errors
  3. Schema type supports optional author fields
**Plans:** TBD

Plans:
- [ ] 15-01: TBD

### Phase 16: Audit Trail UI
**Goal:** Users can see who made each change and restore previous versions
**Depends on:** Phase 15
**Requirements:** AUDT-02, AUDT-03
**Success Criteria** (what must be TRUE):
  1. Version history displays author name and avatar for each version
  2. Legacy versions without author show "Unknown" or system indicator
  3. User can restore any previous version (creates new version with current user as author)
  4. Restored version appears at top of history with correct author attribution
**Plans:** TBD

Plans:
- [ ] 16-01: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Editor UX | v1.0 | 2/2 | Complete | 2026-01-18 |
| 2. Schema Validation | v1.0 | 1/1 | Complete | 2026-01-18 |
| 3. Error Handling | v1.0 | 1/1 | Complete | 2026-01-18 |
| 4. API & Docs | v1.0 | 1/1 | Complete | 2026-01-18 |
| 5. Autocomplete Fixes | v1.1 | 1/1 | Complete | 2026-01-18 |
| 6. Schema Diff Engine | v1.1 | 1/1 | Complete | 2026-01-18 |
| 7. Visual Diff UI | v1.1 | 1/1 | Complete | 2026-01-18 |
| 8. Editor Improvements | v1.1 | 1/1 | Complete | 2026-01-18 |
| 9. Editor Performance | v1.2 | 1/1 | Complete | 2026-01-18 |
| 10. Page Load Optimization | v1.2 | 1/1 | Complete | 2026-01-18 |
| 11. Dashboard Visual Refresh | v1.2 | 1/1 | Complete | 2026-01-18 |
| 12. Responsive Design | v1.2 | 1/1 | Complete | 2026-01-18 |
| 13. Auth Infrastructure | v1.3 | 0/? | Not started | - |
| 14. Route Protection | v1.3 | 0/? | Not started | - |
| 15. Author Attribution | v1.3 | 0/? | Not started | - |
| 16. Audit Trail UI | v1.3 | 0/? | Not started | - |

**Overall:** v1.0 complete, v1.1 complete, v1.2 complete, v1.3 in progress (0/4 phases)

## Domain Expertise

None

---

*For full milestone details, see the archive files in milestones/*
