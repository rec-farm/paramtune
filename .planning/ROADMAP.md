# Roadmap: ParamTune

## Milestones

- ✅ **[v1.0 MVP](milestones/v1.0-ROADMAP.md)** — Phases 1-4 (shipped 2026-01-18)
- 🚧 **v1.1 Schema Diff & Polish** — Phases 5-8 (in progress)

## Completed Milestones

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-01-18</summary>

- [x] Phase 1: Editor UX (2/2 plans) — Autocomplete, theming
- [x] Phase 2: Schema Validation (1/1 plan) — Validation engine, warnings
- [x] Phase 3: Error Handling (1/1 plan) — Error boundaries, type-safe API
- [x] Phase 4: API & Docs (1/1 plan) — OpenAPI spec, docs page

</details>

### 🚧 v1.1 Schema Diff & Polish (In Progress)

**Milestone Goal:** Add schema comparison capabilities with visual diff while polishing the editor experience.

#### Phase 5: Autocomplete Fixes & Editor Polish ✓

**Goal**: Fix autocomplete Enter key bug and improve autocomplete triggering behavior
**Depends on**: v1.0 complete
**Research**: Unlikely (internal patterns)
**Plans**: 1/1 complete

Plans:
- [x] 05-01: Autocomplete Enter key fix and trigger improvements

#### Phase 6: Schema Diff Engine ✓

**Goal**: Build change detection engine to enumerate differences between schema versions
**Depends on**: Phase 5
**Research**: Unlikely (JSON diff patterns)
**Plans**: 1/1 complete

Plans:
- [x] 06-01: Extract diff engine and add cross-schema comparison

#### Phase 7: Visual Diff UI

**Goal**: Create side-by-side comparison view with highlighted changes
**Depends on**: Phase 6
**Research**: Unlikely (internal patterns)
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

#### Phase 8: Editor Improvements

**Goal**: Performance optimization and clearer validation feedback
**Depends on**: Phase 7
**Research**: Unlikely (internal patterns)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Editor UX | v1.0 | 2/2 | Complete | 2026-01-18 |
| 2. Schema Validation | v1.0 | 1/1 | Complete | 2026-01-18 |
| 3. Error Handling | v1.0 | 1/1 | Complete | 2026-01-18 |
| 4. API & Docs | v1.0 | 1/1 | Complete | 2026-01-18 |
| 5. Autocomplete Fixes | v1.1 | 1/1 | Complete | 2026-01-18 |
| 6. Schema Diff Engine | v1.1 | 1/1 | Complete | 2026-01-18 |
| 7. Visual Diff UI | v1.1 | 0/? | Not started | - |
| 8. Editor Improvements | v1.1 | 0/? | Not started | - |

**Overall:** v1.0 complete, v1.1 in progress

## Domain Expertise

None

---

*For full milestone details, see the archive files in milestones/*
