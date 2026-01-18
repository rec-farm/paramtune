# Roadmap: ParamTune

## Overview

Transform ParamTune from a functional schema management tool into a delightful editing experience. Starting with editor UX improvements (the core value), then adding validation to catch errors early, improving reliability with proper error handling, and finally enhancing API documentation for consumers.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Editor UX** ✓ - Syntax highlighting, autocomplete, better JSON editing experience
- [x] **Phase 2: Schema Validation** ✓ - Type checking, linting, validation rules before save
- [ ] **Phase 3: Error Handling** - Proper error handling, stability improvements
- [ ] **Phase 4: API & Docs** - Better API documentation, consumption improvements

## Phase Details

### Phase 1: Editor UX
**Goal**: Make schema editing a joy with syntax highlighting, autocomplete, and intuitive controls
**Depends on**: Nothing (first phase)
**Research**: Likely (JSON editor libraries)
**Research topics**: Monaco Editor vs CodeMirror for React, JSON autocomplete implementations, syntax highlighting themes
**Plans**: 2/2 complete (01-01 ✓, 01-02 ✓)

### Phase 2: Schema Validation
**Goal**: Catch errors before save with real-time validation and helpful error messages
**Depends on**: Phase 1
**Research**: Likely (validation libraries)
**Research topics**: JSON Schema validation libraries (ajv, zod), real-time validation patterns, error message UX
**Plans**: 1/1 complete (02-01 ✓)

### Phase 3: Error Handling
**Goal**: Graceful error handling throughout the app with clear user feedback
**Depends on**: Phase 2
**Research**: Unlikely (internal patterns)
**Plans**: TBD

### Phase 4: API & Docs
**Goal**: Comprehensive API documentation and improved developer experience for consumers
**Depends on**: Phase 3
**Research**: Unlikely (documentation patterns)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Editor UX | 2/2 | Complete | 2026-01-18 |
| 2. Schema Validation | 1/1 | Complete | 2026-01-18 |
| 3. Error Handling | 0/TBD | Not started | - |
| 4. API & Docs | 0/TBD | Not started | - |
