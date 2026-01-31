# Requirements: ParamTune v1.3

**Defined:** 2026-01-31
**Core Value:** Enable team accountability by tracking who makes each schema change

## v1.3 Requirements

### Authentication

- [x] **AUTH-01**: User can sign in with Google SSO
- [x] **AUTH-02**: User session persists across browser restarts
- [x] **AUTH-03**: User sees their name and avatar in the header when logged in
- [x] **AUTH-04**: User can log out with a single click
- [x] **AUTH-05**: Dashboard routes require authentication (redirect to login)
- [x] **AUTH-06**: After login, user returns to their intended destination

### Audit Trail

- [ ] **AUDT-01**: Schema version records author (user ID, name, avatar) on save
- [ ] **AUDT-02**: Version history displays author name and avatar for each version
- [ ] **AUDT-03**: User can restore a previous schema version (creates new version with current user as author)
- [ ] **AUDT-04**: Legacy schemas without author display gracefully (show "Unknown" or system indicator)

## Future Requirements

### v1.4+ (After Validation)

- **AUDT-05**: Activity feed showing recent changes across all platforms
- **AUDT-06**: Optional change annotation (commit message) when saving
- **AUDT-07**: Filter version history by author

### v2+ (Future Consideration)

- **AUTH-10**: Additional SSO providers (GitHub, Microsoft)
- **AUTH-11**: Role-based permissions (admin/editor/viewer)
- **AUTH-12**: Session management UI (view/revoke sessions)
- **AUDT-10**: Change approval workflows
- **AUDT-11**: Detailed action logging beyond schema modifications

## Out of Scope

| Feature | Reason |
|---------|--------|
| Email/password auth | Security liability; Google SSO sufficient |
| Role-based permissions | Complexity disproportionate to value for v1.3 |
| Real-time collaboration | Massive engineering complexity; version history is collaboration mechanism |
| Detailed action logging | Storage bloat; log schema modifications only |
| MFA/2FA | Google already provides this via account security |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 13 | Complete |
| AUTH-02 | Phase 13 | Complete |
| AUTH-03 | Phase 14 | Complete |
| AUTH-04 | Phase 13 | Complete |
| AUTH-05 | Phase 14 | Complete |
| AUTH-06 | Phase 14 | Complete |
| AUDT-01 | Phase 15 | Pending |
| AUDT-02 | Phase 16 | Pending |
| AUDT-03 | Phase 16 | Pending |
| AUDT-04 | Phase 15 | Pending |

**Coverage:**
- v1.3 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0

---
*Requirements defined: 2026-01-31*
*Last updated: 2026-01-31 after roadmap creation*
